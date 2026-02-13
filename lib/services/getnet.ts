// Getnet Payment Gateway Service
// Documentation: https://docs.globalgetnet.com/en/products/online-payments/regional-api

interface GetnetConfig {
    clientId: string;
    clientSecret: string;
    merchantId: string;
    sellerId: string;
    apiUrl: string;
    environment: 'sandbox' | 'production';
}

interface GetnetAuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

interface PaymentRequest {
    amount: number; // in cents (e.g., 1000 = R$ 10.00)
    currency: string; // 'BRL'
    orderId: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerDocument: string; // CPF
    card: {
        number: string;
        holderName: string;
        expirationMonth: string;
        expirationYear: string;
        securityCode: string;
    };
    installments?: number; // 1-12
}

interface PaymentResponse {
    paymentId: string;
    status: 'approved' | 'pending' | 'declined' | 'error';
    authorizationCode?: string;
    message?: string;
    transactionId?: string;
}

class GetnetService {
    private config: GetnetConfig;
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    private get isConfigured(): boolean {
        return !!(this.config.clientId && this.config.clientSecret);
    }

    constructor() {
        this.config = {
            clientId: process.env.GETNET_CLIENT_ID || '',
            clientSecret: process.env.GETNET_CLIENT_SECRET || '',
            merchantId: process.env.GETNET_MERCHANT_ID || '',
            sellerId: process.env.GETNET_SELLER_ID || '',
            apiUrl: process.env.GETNET_API_URL || 'https://api-sbx.globalgetnet.com',
            environment: (process.env.GETNET_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
        };
    }

    /**
     * Get OAuth2 access token
     */
    private async getAccessToken(): Promise<string> {
        if (!this.isConfigured) {
            throw new Error('Getnet credentials not configured. Set GETNET_CLIENT_ID and GETNET_CLIENT_SECRET environment variables.');
        }

        // Return cached token if still valid
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        const credentials = Buffer.from(
            `${this.config.clientId}:${this.config.clientSecret}`
        ).toString('base64');

        try {
            const response = await fetch(
                `${this.config.apiUrl}/authentication/oauth2/access_token`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: 'grant_type=client_credentials',
                }
            );

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Getnet auth failed: ${error}`);
            }

            const data: GetnetAuthResponse = await response.json();

            this.accessToken = data.access_token;
            // Set expiry to 5 minutes before actual expiry for safety
            this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

            console.log('✅ Getnet access token obtained');
            return this.accessToken;

        } catch (error) {
            console.error('❌ Getnet authentication error:', error);
            throw error;
        }
    }

    /**
     * Create a payment transaction
     */
    async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            const token = await this.getAccessToken();

            // Generate proper UUIDs for Regional API v2
            const { randomUUID } = await import('crypto');
            const requestId = randomUUID();
            const idempotencyKey = randomUUID();

            // Regional API v2 payload structure (based on actual error response)
            const payload = {
                idempotency_key: idempotencyKey,
                request_id: requestId,
                order_id: request.orderId,
                data: {
                    customer_id: request.customerId,
                    amount: request.amount,
                    currency: request.currency,
                    payment: {
                        payment_method: 'CREDIT', // Must be CREDIT (not credit_card)
                        transaction_type: 'FULL',
                        number_installments: request.installments || 1,
                        card: {
                            number: request.card.number.replace(/\s/g, ''),
                            cardholder_name: request.card.holderName,
                            expiration_month: request.card.expirationMonth,
                            expiration_year: request.card.expirationYear.slice(-2), // Last 2 digits only
                            security_code: request.card.securityCode,
                        },
                    },
                },
            };

            const response = await fetch(
                `${this.config.apiUrl}/dpm/payments-gwproxy/v2/payments`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'x-seller-id': this.config.sellerId,
                    },
                    body: JSON.stringify(payload),
                }
            );

            // Log response details for debugging
            console.log('Getnet response status:', response.status);
            console.log('Getnet response headers:', Object.fromEntries(response.headers.entries()));

            // Get response text first
            const responseText = await response.text();
            console.log('Getnet response body:', responseText.substring(0, 500));

            // Try to parse as JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('❌ Failed to parse Getnet response as JSON');
                console.error('Response was:', responseText.substring(0, 1000));
                return {
                    paymentId: '',
                    status: 'error',
                    message: `API returned non-JSON response (Status ${response.status})`,
                };
            }

            if (!response.ok) {
                console.error('❌ Getnet payment error:', data);
                return {
                    paymentId: '',
                    status: 'error',
                    message: data.message || data.details?.[0]?.description_detail || 'Payment failed',
                };
            }

            console.log('✅ Getnet payment created:', data);

            return {
                paymentId: data.payment_id || data.id || '',
                status: this.mapStatus(data.status || 'ERROR'),
                authorizationCode: data.authorization_code,
                transactionId: data.payment_id || '',
                message: data.status_detail?.message,
            };

        } catch (error) {
            console.error('❌ Getnet payment error:', error);
            return {
                paymentId: '',
                status: 'error',
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Get payment status
     */
    async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
        try {
            const token = await this.getAccessToken();

            const response = await fetch(
                `${this.config.apiUrl}/dpm/payments-gwproxy/v2/payments/${paymentId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-seller-id': this.config.sellerId,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to get payment status: ${response.statusText}`);
            }

            const data = await response.json();

            return {
                paymentId: data.payment_id,
                status: this.mapStatus(data.status),
                authorizationCode: data.authorization_code,
                transactionId: data.payment_id,
                message: data.status_detail?.message,
            };

        } catch (error) {
            console.error('❌ Getnet status check error:', error);
            throw error;
        }
    }

    /**
     * Map Getnet status to our internal status
     */
    private mapStatus(getnetStatus: string): 'approved' | 'pending' | 'declined' | 'error' {
        const statusMap: Record<string, 'approved' | 'pending' | 'declined' | 'error'> = {
            'APPROVED': 'approved',
            'AUTHORIZED': 'approved',
            'PENDING': 'pending',
            'DENIED': 'declined',
            'ERROR': 'error',
            'CANCELED': 'declined',
        };

        return statusMap[getnetStatus] || 'error';
    }

    /**
     * Test connection and credentials
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.getAccessToken();
            console.log('✅ Getnet connection test successful');
            return true;
        } catch (error) {
            console.error('❌ Getnet connection test failed:', error);
            return false;
        }
    }
}

// Export singleton instance
export const getnetService = new GetnetService();

// Export types
export type { PaymentRequest, PaymentResponse };
