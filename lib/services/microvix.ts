/**
 * Linx Microvix WebAPI Integration
 * 
 * SOAP/XML-based API for stock management, products, orders, and customers.
 * Base URL: https://webapi.microvix.com.br/1.0/api/integracao
 * Auth: Basic (credentials via env vars MICROVIX_USER + MICROVIX_PASSWORD + MICROVIX_API_KEY)
 * 
 * Docs: https://developers.linkapi.solutions/docs/microvix
 */

// ─── Configuration ─────────────────────────────────────────────────────────────

const MICROVIX_BASE_URL = process.env.MICROVIX_BASE_URL || 'https://webapi.microvix.com.br/1.0/api/integracao';
const MICROVIX_USER = process.env.MICROVIX_USER || '';
const MICROVIX_PASSWORD = process.env.MICROVIX_PASSWORD || '';
const MICROVIX_KEY = process.env.MICROVIX_API_KEY || '';
const MICROVIX_GROUP = process.env.MICROVIX_GROUP || '';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface MicrovixProduct {
    codigoproduto: string;
    nome?: string;
    referencia?: string;
    codebar?: string;
    preco?: number;
    preco_custo?: number;
    ativo?: boolean;
    marca?: string;
    setor?: string;
    linha?: string;
    disponivel_loja_virtual?: boolean;
    timestamp?: string;
}

export interface MicrovixProductDetail {
    codigoproduto: string;
    tamanho?: string;
    cor?: string;
    quantidade_estoque?: number;
    preco?: number;
    codebar?: string;
    ativo?: boolean;
    timestamp?: string;
}

export interface MicrovixStockItem {
    codigoproduto: string;
    empresa?: number;
    quantidade?: number;
    deposito?: string;
    timestamp?: string;
}

export interface MicrovixOrder {
    id_pedido?: string;
    id_cliente?: string;
    data_pedido?: string;
    valor_total?: number;
    status?: string;
    items?: MicrovixOrderItem[];
}

export interface MicrovixOrderItem {
    codigoproduto: string;
    quantidade: number;
    preco_unitario: number;
    tamanho?: string;
    cor?: string;
}

export interface MicrovixCustomer {
    doc_cliente?: string;
    nm_cliente?: string;
    email?: string;
    fone?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
}

export interface MicrovixSyncResult {
    success: boolean;
    endpoint: string;
    records_fetched: number;
    records_synced: number;
    errors: string[];
    timestamp: string;
}

// ─── XML Builder ────────────────────────────────────────────────────────────────

function buildSoapEnvelope(method: string, params: Record<string, string | number> = {}): string {
    const paramXml = Object.entries(params)
        .map(([key, val]) => `<${key}>${escapeXml(String(val))}</${key}>`)
        .join('\n            ');

    return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                 xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
                 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
    <soap12:Body>
        <LinxMicrovix>
            <Authentication user="${escapeXml(MICROVIX_USER)}" password="${escapeXml(MICROVIX_PASSWORD)}" />
            <Command>
                <Name>${escapeXml(method)}</Name>
                <Parameters>
                    ${paramXml}
                    <chave>${escapeXml(MICROVIX_KEY)}</chave>
                    <cnpj_emp></cnpj_emp>
                </Parameters>
            </Command>
        </LinxMicrovix>
    </soap12:Body>
</soap12:Envelope>`;
}

function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// ─── XML Parser (lightweight) ───────────────────────────────────────────────────

function extractTagValue(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
}

function extractAllRecords(xml: string): Record<string, string>[] {
    const records: Record<string, string>[] = [];

    // Microvix returns data in <Row> or <NewDataSet><Table> format
    const rowRegex = /<(?:Row|Table|Registro)>([\s\S]*?)<\/(?:Row|Table|Registro)>/gi;
    let match;

    while ((match = rowRegex.exec(xml)) !== null) {
        const rowXml = match[1];
        const record: Record<string, string> = {};

        // Extract all field tags within the row
        const fieldRegex = /<(\w+)>([^<]*)<\/\1>/g;
        let fieldMatch;

        while ((fieldMatch = fieldRegex.exec(rowXml)) !== null) {
            record[fieldMatch[1].toLowerCase()] = fieldMatch[2].trim();
        }

        if (Object.keys(record).length > 0) {
            records.push(record);
        }
    }

    return records;
}

// ─── API Call ───────────────────────────────────────────────────────────────────

async function callMicrovix(
    method: string,
    params: Record<string, string | number> = {}
): Promise<{ success: boolean; data: Record<string, string>[]; rawXml: string; error?: string }> {
    if (!MICROVIX_KEY) {
        return { success: false, data: [], rawXml: '', error: 'MICROVIX_API_KEY not configured' };
    }

    try {
        const soapXml = buildSoapEnvelope(method, params);

        const response = await fetch(MICROVIX_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/soap+xml; charset=utf-8',
            },
            body: soapXml,
        });

        const responseXml = await response.text();

        if (!response.ok) {
            return {
                success: false,
                data: [],
                rawXml: responseXml,
                error: `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        // Check for SOAP faults
        if (responseXml.includes('<soap:Fault>') || responseXml.includes('<Fault>')) {
            const faultString = extractTagValue(responseXml, 'faultstring') ||
                extractTagValue(responseXml, 'Message') ||
                'Unknown SOAP error';
            return {
                success: false,
                data: [],
                rawXml: responseXml,
                error: faultString,
            };
        }

        const records = extractAllRecords(responseXml);

        return {
            success: true,
            data: records,
            rawXml: responseXml,
        };
    } catch (error: any) {
        return {
            success: false,
            data: [],
            rawXml: '',
            error: error.message || 'Network error calling Microvix',
        };
    }
}

// ─── Public Methods ─────────────────────────────────────────────────────────────

/**
 * Fetch all products from Microvix
 */
export async function getProducts(timestamp?: string): Promise<{ success: boolean; products: MicrovixProduct[]; error?: string }> {
    const params: Record<string, string | number> = {};
    if (timestamp) params.timestamp = timestamp;

    const result = await callMicrovix('B2CConsultaProdutos', params);

    if (!result.success) {
        return { success: false, products: [], error: result.error };
    }

    const products: MicrovixProduct[] = result.data.map(row => ({
        codigoproduto: row.codigoproduto || row.codigo_produto || '',
        nome: row.nome || row.nome_produto || '',
        referencia: row.referencia || '',
        codebar: row.codebar || row.codigo_barras || '',
        preco: parseFloat(row.preco || row.preco_venda || '0'),
        preco_custo: parseFloat(row.preco_custo || '0'),
        ativo: row.ativo === 'true' || row.ativo === '1',
        marca: row.marca || '',
        setor: row.setor || '',
        linha: row.linha || '',
        disponivel_loja_virtual: row.disponivel_loja_virtual === 'true' || row.disponivel_loja_virtual === '1',
        timestamp: row.timestamp || '',
    }));

    return { success: true, products };
}

/**
 * Fetch product details (sizes, colors, stock per variant)
 */
export async function getProductDetails(timestamp?: string): Promise<{ success: boolean; details: MicrovixProductDetail[]; error?: string }> {
    const params: Record<string, string | number> = {};
    if (timestamp) params.timestamp = timestamp;

    const result = await callMicrovix('B2CConsultaProdutosDetalhes', params);

    if (!result.success) {
        return { success: false, details: [], error: result.error };
    }

    const details: MicrovixProductDetail[] = result.data.map(row => ({
        codigoproduto: row.codigoproduto || row.codigo_produto || '',
        tamanho: row.tamanho || row.grade_tamanho || '',
        cor: row.cor || row.grade_cor || '',
        quantidade_estoque: parseInt(row.quantidade_estoque || row.estoque || '0', 10),
        preco: parseFloat(row.preco || row.preco_venda || '0'),
        codebar: row.codebar || row.codigo_barras || '',
        ativo: row.ativo === 'true' || row.ativo === '1',
        timestamp: row.timestamp || '',
    }));

    return { success: true, details };
}

/**
 * Fetch product barcodes
 */
export async function getProductCodebars(timestamp?: string): Promise<{ success: boolean; codebars: Record<string, string>[]; error?: string }> {
    const params: Record<string, string | number> = {};
    if (timestamp) params.timestamp = timestamp;

    const result = await callMicrovix('B2CConsultaProdutosCodebar', params);

    if (!result.success) {
        return { success: false, codebars: [], error: result.error };
    }

    return { success: true, codebars: result.data };
}

/**
 * Fetch product costs
 */
export async function getProductCosts(timestamp?: string): Promise<{ success: boolean; costs: Record<string, string>[]; error?: string }> {
    const params: Record<string, string | number> = {};
    if (timestamp) params.timestamp = timestamp;

    const result = await callMicrovix('B2CConsultaProdutosCustos', params);

    if (!result.success) {
        return { success: false, costs: [], error: result.error };
    }

    return { success: true, costs: result.data };
}

/**
 * Fetch brands
 */
export async function getBrands(): Promise<{ success: boolean; brands: Record<string, string>[]; error?: string }> {
    const result = await callMicrovix('B2CConsultaMarcas');

    if (!result.success) {
        return { success: false, brands: [], error: result.error };
    }

    return { success: true, brands: result.data };
}

/**
 * Fetch sectors/categories
 */
export async function getSectors(): Promise<{ success: boolean; sectors: Record<string, string>[]; error?: string }> {
    const result = await callMicrovix('B2CConsultaSetores');

    if (!result.success) {
        return { success: false, sectors: [], error: result.error };
    }

    return { success: true, sectors: result.data };
}

/**
 * Fetch product lines
 */
export async function getLines(): Promise<{ success: boolean; lines: Record<string, string>[]; error?: string }> {
    const result = await callMicrovix('B2CConsultaLinhas');

    if (!result.success) {
        return { success: false, lines: [], error: result.error };
    }

    return { success: true, lines: result.data };
}

/**
 * Fetch orders
 */
export async function getOrders(timestamp?: string): Promise<{ success: boolean; orders: Record<string, string>[]; error?: string }> {
    const params: Record<string, string | number> = {};
    if (timestamp) params.timestamp = timestamp;

    const result = await callMicrovix('B2CConsultaPedidos', params);

    if (!result.success) {
        return { success: false, orders: [], error: result.error };
    }

    return { success: true, orders: result.data };
}

/**
 * Fetch order items
 */
export async function getOrderItems(timestamp?: string): Promise<{ success: boolean; items: Record<string, string>[]; error?: string }> {
    const params: Record<string, string | number> = {};
    if (timestamp) params.timestamp = timestamp;

    const result = await callMicrovix('B2CConsultaPedidosItens', params);

    if (!result.success) {
        return { success: false, items: [], error: result.error };
    }

    return { success: true, items: result.data };
}

/**
 * Fetch customers
 */
export async function getCustomers(timestamp?: string): Promise<{ success: boolean; customers: MicrovixCustomer[]; error?: string }> {
    const params: Record<string, string | number> = {};
    if (timestamp) params.timestamp = timestamp;

    const result = await callMicrovix('B2CConsultaClientes', params);

    if (!result.success) {
        return { success: false, customers: [], error: result.error };
    }

    const customers: MicrovixCustomer[] = result.data.map(row => ({
        doc_cliente: row.doc_cliente || row.cpf || row.cnpj || '',
        nm_cliente: row.nm_cliente || row.nome || '',
        email: row.email || '',
        fone: row.fone || row.telefone || '',
        endereco: row.endereco || '',
        cidade: row.cidade || '',
        estado: row.estado || row.uf || '',
        cep: row.cep || '',
    }));

    return { success: true, customers };
}

/**
 * Register/update a customer in Microvix
 */
export async function registerCustomer(customer: MicrovixCustomer): Promise<{ success: boolean; error?: string }> {
    const params: Record<string, string | number> = {
        doc_cliente: customer.doc_cliente || '',
        nm_cliente: customer.nm_cliente || '',
        email: customer.email || '',
        fone: customer.fone || '',
        endereco: customer.endereco || '',
        cidade: customer.cidade || '',
        estado: customer.estado || '',
        cep: customer.cep || '',
    };

    const result = await callMicrovix('B2CCadastraClientes', params);
    return { success: result.success, error: result.error };
}

/**
 * Create an order in Microvix
 */
export async function createOrder(order: MicrovixOrder): Promise<{ success: boolean; orderId?: string; error?: string }> {
    const params: Record<string, string | number> = {
        id_cliente: order.id_cliente || '',
        valor_total: order.valor_total || 0,
    };

    const result = await callMicrovix('B2CCadastraPedido', params);

    if (!result.success) {
        return { success: false, error: result.error };
    }

    const orderId = result.data[0]?.id_pedido || result.data[0]?.numero_pedido || '';
    return { success: true, orderId };
}

/**
 * Add items to an order in Microvix
 */
export async function addOrderItems(orderId: string, items: MicrovixOrderItem[]): Promise<{ success: boolean; error?: string }> {
    const errors: string[] = [];

    for (const item of items) {
        const params: Record<string, string | number> = {
            id_pedido: orderId,
            codigoproduto: item.codigoproduto,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
        };
        if (item.tamanho) params.tamanho = item.tamanho;
        if (item.cor) params.cor = item.cor;

        const result = await callMicrovix('B2CCadastraPedidoItens', params);
        if (!result.success) {
            errors.push(`Item ${item.codigoproduto}: ${result.error}`);
        }
    }

    return { success: errors.length === 0, error: errors.join('; ') || undefined };
}

/**
 * Fetch NFe (invoices)
 */
export async function getNFe(timestamp?: string): Promise<{ success: boolean; nfe: Record<string, string>[]; error?: string }> {
    const params: Record<string, string | number> = {};
    if (timestamp) params.timestamp = timestamp;

    const result = await callMicrovix('B2CConsultaNFe', params);

    if (!result.success) {
        return { success: false, nfe: [], error: result.error };
    }

    return { success: true, nfe: result.data };
}

/**
 * Test the Microvix connection
 */
export async function testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!MICROVIX_KEY) {
        return {
            success: false,
            message: 'Microvix API key not configured. Set MICROVIX_API_KEY environment variable.',
            details: { configured: false }
        };
    }

    // Try fetching brands as a simple connectivity test
    const result = await callMicrovix('B2CConsultaMarcas');

    if (result.success) {
        return {
            success: true,
            message: `Connected to Microvix! Found ${result.data.length} brands.`,
            details: {
                configured: true,
                base_url: MICROVIX_BASE_URL,
                brands_count: result.data.length,
            }
        };
    }

    return {
        success: false,
        message: `Connection failed: ${result.error}`,
        details: {
            configured: true,
            base_url: MICROVIX_BASE_URL,
            error: result.error,
        }
    };
}

// ─── Export Utility ─────────────────────────────────────────────────────────────

export const microvix = {
    testConnection,
    getProducts,
    getProductDetails,
    getProductCodebars,
    getProductCosts,
    getBrands,
    getSectors,
    getLines,
    getOrders,
    getOrderItems,
    getCustomers,
    registerCustomer,
    createOrder,
    addOrderItems,
    getNFe,
};
