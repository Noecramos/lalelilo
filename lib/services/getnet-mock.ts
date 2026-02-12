// Mock Getnet Service for Testing/Demo
// This simulates Getnet responses so you can demo the system
// Replace with real getnet.ts when credentials are ready

interface GetnetConfig {
    clientId: string;
    clientSecret: string;
    merchantId: string;
    sellerId: string;
    apiUrl: string;
    environment: 'sandbox' | 'production' | 'test';
}

interface PaymentRequest {
    amount: number;
    currency: string;
    orderId: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerDocument: string;
    card: {
        number: string;
        holderName: string;
        expirationMonth: string;
        expirationYear: string;
        securityCode: string;
    };
    installments?: number;
}

interface PaymentResponse {
    paymentId: string;
    status: 'approved' | 'pending' | 'declined' | 'error';
    authorizationCode?: string;
    message?: string;
    transactionId?: string;
}

class MockGetnetService {
    private config: GetnetConfig;

    constructor() {
        this.config = {
            clientId: process.env.GETNET_CLIENT_ID || '',
            clientSecret: process.env.GETNET_CLIENT_SECRET || '',
            merchantId: process.env.GETNET_MERCHANT_ID || '',
            sellerId: process.env.GETNET_SELLER_ID || '',
            apiUrl: process.env.GETNET_API_URL || 'https://api-sbx.globalgetnet.com',
            environment: 'test',
        };

        console.log('⚠️ USING MOCK GETNET SERVICE - FOR TESTING ONLY');
    }

    /**
     * Mock payment creation - simulates Getnet response
     */
    async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const cardNumber = request.card.number.replace(/\s/g, '');

        // Test cards (same as real Getnet)
        const approvedCard = '4012001037141112';
        const declinedCard = '4012001038443335';

        const paymentId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const authCode = `AUTH${Math.floor(Math.random() * 1000000)}`;

        // Simulate approval/decline based on card number
        if (cardNumber === approvedCard) {
            console.log('✅ Mock payment APPROVED:', paymentId);
            return {
                paymentId,
                status: 'approved',
                authorizationCode: authCode,
                transactionId: paymentId,
                message: 'Payment approved (TEST MODE)',
            };
        } else if (cardNumber === declinedCard) {
            console.log('❌ Mock payment DECLINED:', paymentId);
            return {
                paymentId,
                status: 'declined',
                message: 'Payment declined by issuer (TEST MODE)',
            };
        } else {
            // Any other card number - approve it for demo purposes
            console.log('✅ Mock payment APPROVED (demo):', paymentId);
            return {
                paymentId,
                status: 'approved',
                authorizationCode: authCode,
                transactionId: paymentId,
                message: 'Payment approved (TEST MODE - Demo Card)',
            };
        }
    }

    /**
     * Mock payment status check
     */
    async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            paymentId,
            status: 'approved',
            authorizationCode: 'AUTH123456',
            transactionId: paymentId,
            message: 'Payment approved (TEST MODE)',
        };
    }

    /**
     * Test connection - always succeeds in mock mode
     */
    async testConnection(): Promise<boolean> {
        console.log('✅ Mock Getnet connection test (always succeeds)');
        return true;
    }
}

// Export singleton instance
export const getnetService = new MockGetnetService();

// Export types
export type { PaymentRequest, PaymentResponse };
