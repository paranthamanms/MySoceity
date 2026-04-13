package com.mysociety.user.service;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class BulkInviteService {

    private static final Logger logger = LoggerFactory.getLogger(BulkInviteService.class);

    private final SMSService smsService;
    private final EmailService emailService;

    @Value("${notification.invite.default-template:Hi {{name}},\\n\\nYou are invited to join MySociety on NammaSociety.\\n\\nDownload the app:\\nAndroid: {{androidLink}}\\niOS: {{iosLink}}\\n\\nRegards,\\n{{senderName}}}")
    private String defaultInviteTemplate;

    public BulkInviteService(SMSService smsService, EmailService emailService) {
        this.smsService = smsService;
        this.emailService = emailService;
    }

    public Map<String, Object> processBulkInvites(
            MultipartFile file,
            boolean sendSMS,
            boolean sendWhatsApp,
            boolean sendEmail,
            String iosLink,
            String androidLink,
            String senderName,
            String messageTemplate) {

        Map<String, Object> result = new HashMap<>();
        List<InviteRecipient> recipients = readRecipients(file);

        if (recipients.isEmpty()) {
            result.put("success", false);
            result.put("message", "No valid contacts found in file. Expected columns: name, phoneNumber, email");
            result.put("totalContacts", 0);
            result.put("failedCount", 0);
            return result;
        }

        String safeIosLink = defaultIfBlank(iosLink, "https://apps.apple.com");
        String safeAndroidLink = defaultIfBlank(androidLink, "https://play.google.com/store");
        String safeSenderName = defaultIfBlank(senderName, "NammaSociety Team");
        String safeTemplate = defaultIfBlank(messageTemplate, defaultInviteTemplate);

        int smsSent = 0;
        int whatsappSent = 0;
        int emailSent = 0;
        int failedCount = 0;
        List<String> failures = new ArrayList<>();

        for (InviteRecipient recipient : recipients) {
            boolean deliveredAny = false;
            String message = buildInviteMessage(safeTemplate, recipient.name(), safeAndroidLink, safeIosLink, safeSenderName);

            try {
                if (sendSMS && hasText(recipient.phoneNumber())) {
                    smsService.sendSMS(recipient.phoneNumber(), message);
                    smsSent++;
                    deliveredAny = true;
                }
            } catch (Exception e) {
                failures.add("SMS failed for " + recipient.display() + ": " + e.getMessage());
                logger.warn("SMS invite failed for {}", recipient.display(), e);
            }

            try {
                // WhatsApp channel is mapped to SMS transport until a dedicated provider is configured.
                if (sendWhatsApp && hasText(recipient.phoneNumber())) {
                    smsService.sendSMS(recipient.phoneNumber(), "WhatsApp Invite: " + message);
                    whatsappSent++;
                    deliveredAny = true;
                }
            } catch (Exception e) {
                failures.add("WhatsApp failed for " + recipient.display() + ": " + e.getMessage());
                logger.warn("WhatsApp invite failed for {}", recipient.display(), e);
            }

            try {
                if (sendEmail && hasText(recipient.email())) {
                    List<String> recipientList = new ArrayList<>();
                    recipientList.add(recipient.email());
                    emailService.sendAnnouncementEmail(recipientList, "You're invited to MySociety", message, "invite");
                    emailSent++;
                    deliveredAny = true;
                }
            } catch (Exception e) {
                failures.add("Email failed for " + recipient.display() + ": " + e.getMessage());
                logger.warn("Email invite failed for {}", recipient.display(), e);
            }

            if (!deliveredAny) {
                failedCount++;
                failures.add("No eligible channel details for " + recipient.display());
            }
        }

        result.put("success", true);
        result.put("message", "Bulk invite processed successfully");
        result.put("totalContacts", recipients.size());
        result.put("smsSent", smsSent);
        result.put("whatsappSent", whatsappSent);
        result.put("emailSent", emailSent);
        result.put("failedCount", failedCount);
        result.put("failures", failures);
        return result;
    }

    private List<InviteRecipient> readRecipients(MultipartFile file) {
        String fileName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            return readFromExcel(file);
        }
        return readFromCsv(file);
    }

    private List<InviteRecipient> readFromCsv(MultipartFile file) {
        List<InviteRecipient> recipients = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean firstLine = true;
            int idxName = 0;
            int idxPhone = 1;
            int idxEmail = 2;

            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }

                String[] cols = parseCsvLine(line);
                if (firstLine) {
                    Map<String, Integer> headerMap = buildHeaderMap(cols);
                    idxName = headerMap.getOrDefault("name", 0);
                    idxPhone = headerMap.getOrDefault("phonenumber", headerMap.getOrDefault("phone", 1));
                    idxEmail = headerMap.getOrDefault("email", 2);
                    firstLine = false;
                    continue;
                }

                String name = get(cols, idxName);
                String phone = get(cols, idxPhone);
                String email = get(cols, idxEmail);

                if (!hasText(name) && !hasText(phone) && !hasText(email)) {
                    continue;
                }

                recipients.add(new InviteRecipient(name, sanitizePhone(phone), email));
            }
        } catch (Exception e) {
            logger.error("Failed to parse CSV invite file", e);
        }

        return recipients;
    }

    private List<InviteRecipient> readFromExcel(MultipartFile file) {
        List<InviteRecipient> recipients = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            boolean firstRow = true;
            int idxName = 0;
            int idxPhone = 1;
            int idxEmail = 2;

            for (Row row : sheet) {
                if (firstRow) {
                    String[] headers = rowToArray(row);
                    Map<String, Integer> headerMap = buildHeaderMap(headers);
                    idxName = headerMap.getOrDefault("name", 0);
                    idxPhone = headerMap.getOrDefault("phonenumber", headerMap.getOrDefault("phone", 1));
                    idxEmail = headerMap.getOrDefault("email", 2);
                    firstRow = false;
                    continue;
                }

                String[] values = rowToArray(row);
                String name = get(values, idxName);
                String phone = get(values, idxPhone);
                String email = get(values, idxEmail);

                if (!hasText(name) && !hasText(phone) && !hasText(email)) {
                    continue;
                }

                recipients.add(new InviteRecipient(name, sanitizePhone(phone), email));
            }
        } catch (Exception e) {
            logger.error("Failed to parse Excel invite file", e);
        }

        return recipients;
    }

    private String[] rowToArray(Row row) {
        if (row == null) {
            return new String[0];
        }

        int last = Math.max(row.getLastCellNum(), 0);
        String[] values = new String[last];

        for (int i = 0; i < last; i++) {
            Cell cell = row.getCell(i);
            values[i] = getCellValue(cell);
        }

        return values;
    }

    private String getCellValue(Cell cell) {
        if (cell == null) {
            return "";
        }

        if (cell.getCellType() == CellType.NUMERIC) {
            return String.valueOf((long) cell.getNumericCellValue());
        }

        cell.setCellType(CellType.STRING);
        return cell.getStringCellValue() == null ? "" : cell.getStringCellValue().trim();
    }

    private Map<String, Integer> buildHeaderMap(String[] headers) {
        Map<String, Integer> map = new HashMap<>();
        for (int i = 0; i < headers.length; i++) {
            String key = headers[i] == null ? "" : headers[i].trim().toLowerCase(Locale.ROOT);
            map.put(key, i);
        }
        return map;
    }

    private String buildInviteMessage(String template, String name, String androidLink, String iosLink, String senderName) {
        return template
                .replace("{{name}}", defaultIfBlank(name, "Resident"))
                .replace("{{androidLink}}", androidLink)
                .replace("{{iosLink}}", iosLink)
                .replace("{{senderName}}", senderName);
    }

    private String sanitizePhone(String phone) {
        if (!hasText(phone)) {
            return "";
        }
        return phone.replaceAll("[^0-9]", "");
    }

    private String[] parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder currentValue = new StringBuilder();

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(currentValue.toString().trim().replaceAll("^\"|\"$", ""));
                currentValue = new StringBuilder();
            } else {
                currentValue.append(c);
            }
        }

        result.add(currentValue.toString().trim().replaceAll("^\"|\"$", ""));
        return result.toArray(new String[0]);
    }

    private String get(String[] values, int index) {
        if (values == null || index < 0 || index >= values.length) {
            return "";
        }
        return values[index] == null ? "" : values[index].trim();
    }

    private String defaultIfBlank(String value, String fallback) {
        return hasText(value) ? value.trim() : fallback;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private record InviteRecipient(String name, String phoneNumber, String email) {
        private String display() {
            if (name != null && !name.isBlank()) {
                return name;
            }
            if (email != null && !email.isBlank()) {
                return email;
            }
            if (phoneNumber != null && !phoneNumber.isBlank()) {
                return phoneNumber;
            }
            return "unknown";
        }
    }
}
