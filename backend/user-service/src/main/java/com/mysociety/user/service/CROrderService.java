package com.mysociety.user.service;

import com.mysociety.user.model.CROrder;
import com.mysociety.user.repository.CROrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CROrderService {
    
    @Autowired
    private CROrderRepository crOrderRepository;

    public CROrder createOrder(CROrder order) {
        return crOrderRepository.save(order);
    }

    public CROrder updateOrder(Long id, CROrder order) throws Exception {
        CROrder existing = crOrderRepository.findById(id)
                .orElseThrow(() -> new Exception("Order not found"));
        
        existing.setStatus(order.getStatus());
        existing.setPaymentStatus(order.getPaymentStatus());
        existing.setPaymentTransactionId(order.getPaymentTransactionId());
        existing.setNotes(order.getNotes());
        
        return crOrderRepository.save(existing);
    }

    public CROrder getOrderById(Long id) throws Exception {
        return crOrderRepository.findById(id)
                .orElseThrow(() -> new Exception("Order not found"));
    }

    public List<CROrder> getAllOrders() {
        return crOrderRepository.findAll();
    }

    public List<CROrder> getOrdersByBuyer(String buyerId) {
        return crOrderRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId);
    }

    public List<CROrder> getOrdersBySociety(String societyName) {
        return crOrderRepository.findBySocietyNameIgnoreCaseOrderByCreatedAtDesc(societyName);
    }

    public List<CROrder> getOrdersByStatus(String status) {
        return crOrderRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    public List<CROrder> getOrdersByPaymentStatus(String paymentStatus) {
        return crOrderRepository.findByPaymentStatusOrderByCreatedAtDesc(paymentStatus);
    }

    public CROrder updateOrderStatus(Long id, String status) throws Exception {
        CROrder order = getOrderById(id);
        order.setStatus(status);
        return crOrderRepository.save(order);
    }

    public CROrder updatePaymentStatus(Long id, String paymentStatus, String transactionId) throws Exception {
        CROrder order = getOrderById(id);
        order.setPaymentStatus(paymentStatus);
        if (transactionId != null) {
            order.setPaymentTransactionId(transactionId);
        }
        return crOrderRepository.save(order);
    }

    public void deleteOrder(Long id) {
        crOrderRepository.deleteById(id);
    }
}

