const db = require('../db');

/**
 * Smart Invoice Integration Service
 * Emite și transmite facturi fiscale prin aplicația Smart Invoice pentru firma:
 * S.C. TRADE INVEST NETWORK S.R.L. (CUI RO42322117)
 */

const TRADE_INVEST_SUPPLIER = {
  name: 'S.C. TRADE INVEST NETWORK S.R.L.',
  cui: '42322117',
  vat_attribute: 'RO',
  full_cui: 'RO42322117',
  reg_com: 'J40/2965/2020',
  iban: 'RO31BACX0000001999343001',
  bank: 'UniCredit Bank',
  address: 'București, Sector 1, Str. Popa Savu, Nr. 78, Biroul 1, Et. 1, Ap. 3',
  country: 'RO'
};

/**
 * Verifică dacă trimiterea automată la încasare este activată
 * Implicit: FALSE (trimiterea se face manual/la buton, conform cerinței)
 */
function isAutoSendEnabled() {
  return process.env.SMART_INVOICE_AUTO_SEND === 'true';
}

/**
 * Formatează CUI-ul clientului cu sau fără prefixul RO în funcție de plătitor TVA
 */
function formatClientVatNumber(vatNumber, isVatPayer) {
  if (!vatNumber) return '';
  const cleanVat = vatNumber.toString().trim().replace(/^RO/i, '').trim();
  return isVatPayer ? `RO${cleanVat}` : cleanVat;
}

/**
 * Pregătește structura completă de factură pentru Smart Invoice
 */
function buildSmartInvoicePayload({
  tenant,
  invoiceLines,
  exchangeRate,
  exchangeRateDate,
  tvaPercent = 21,
  paymentMethod = 'CARD_STRIPE', // sau 'ORDIN_PLATA'
  issueDate = new Date().toISOString().slice(0, 10),
  dueDate = null,
  paymentDate = null,
  periodNote = ''
}) {
  const isRo = (tenant.country_code || 'RO').toUpperCase() === 'RO';
  const currency = isRo ? 'RON' : (tenant.currency || 'EUR');
  const formattedCui = formatClientVatNumber(tenant.vat_number, tenant.is_vat_payer);
  const effectivePaymentDate = paymentDate || issueDate;
  const rateDateNote = exchangeRateDate || effectivePaymentDate;

  // Liniile de factură adaptate
  const lines = invoiceLines.map((line, idx) => {
    const isLineInRon = isRo && line.base_amount_ron != null;
    const unitPrice = isLineInRon ? line.unit_price_ron : line.unit_price_eur;
    const baseAmount = isLineInRon ? line.base_amount_ron : line.base_amount_eur;
    const tvaAmount = isLineInRon ? line.tva_amount_ron : line.tva_amount_eur;
    const totalAmount = isLineInRon ? line.total_with_tva_ron : line.total_with_tva_eur;

    return {
      line_number: idx + 1,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit_measure || 'pers',
      unit_measure: line.unit_measure || 'pers',
      unitPrice: parseFloat(unitPrice.toFixed(4)),
      unit_price: parseFloat(unitPrice.toFixed(4)),
      base_amount: parseFloat(baseAmount.toFixed(2)),
      vatRate: tvaPercent,
      vat_percent: tvaPercent,
      vat_amount: parseFloat(tvaAmount.toFixed(2)),
      total: parseFloat(totalAmount.toFixed(2)),
      total_amount: parseFloat(totalAmount.toFixed(2))
    };
  });

  const subtotal = lines.reduce((acc, l) => acc + l.base_amount, 0);
  const totalVat = lines.reduce((acc, l) => acc + l.vat_amount, 0);
  const grandTotal = lines.reduce((acc, l) => acc + l.total_amount, 0);

  const bnrNote = (isRo && exchangeRate)
    ? `Curs BNR din ziua plății (${rateDateNote}): ${exchangeRate} RON/EUR`
    : '';

  const noteParts = [
    periodNote || 'Abonament servicii Smart QR Pontaj',
    bnrNote,
    'Furnizor: S.C. TRADE INVEST NETWORK S.R.L.'
  ].filter(Boolean);

  const payload = {
    // Câmpuri directe conforme standardului de facturi emise Smart Invoice (refactura-ro)
    tenantId: 1, // STRICT: Se trimite și se asociază doar cu Tenant 1 (Trade Invest Network S.R.L.) din Smart Invoice
    targetTenantId: 1,
    series: process.env.SMART_INVOICE_SERIES || 'QRP',
    clientName: tenant.name,
    clientCUI: formattedCui,
    clientAddress: tenant.billing_address || 'Sediu social',
    clientCountry: isRo ? 'RO' : (tenant.country_code || 'BE'),
    clientEmail: tenant.contact_email,
    issueDate: effectivePaymentDate,
    dueDate: dueDate || effectivePaymentDate,
    currency: currency,
    subtotal: parseFloat(subtotal.toFixed(2)),
    totalVAT: parseFloat(totalVat.toFixed(2)),
    total: parseFloat(grandTotal.toFixed(2)),
    status: paymentMethod === 'CARD_STRIPE' ? 'paid' : 'sent',
    spvStatus: null, // STRICT: Nu se trimite automat în SPV! Rămâne opțiune manuală în Smart Invoice
    notes: noteParts.join(' • '),
    lines: lines,
    
    // Structură completă suplimentară pentru deviz și reconciliere
    supplier: TRADE_INVEST_SUPPLIER,
    client: {
      tenant_id: tenant.id,
      name: tenant.name,
      cui: formattedCui,
      raw_cui: tenant.vat_number,
      is_vat_payer: Boolean(tenant.is_vat_payer),
      address: tenant.billing_address || 'Sediu social conform ONRC',
      country_code: tenant.country_code || 'RO',
      email: tenant.contact_email,
      subdomain: tenant.subdomain
    },
    invoice_header: {
      series: process.env.SMART_INVOICE_SERIES || 'QRP',
      issue_date: effectivePaymentDate,
      due_date: dueDate || effectivePaymentDate,
      payment_date: effectivePaymentDate,
      currency: currency,
      exchange_rate: isRo ? exchangeRate : null,
      exchange_rate_date: isRo ? rateDateNote : null,
      payment_method: paymentMethod,
      is_paid: paymentMethod === 'CARD_STRIPE',
      notes: noteParts.join(' • ')
    },
    totals: {
      subtotal: parseFloat(subtotal.toFixed(2)),
      total_vat: parseFloat(totalVat.toFixed(2)),
      grand_total: parseFloat(grandTotal.toFixed(2)),
      currency: currency
    }
  };

  return payload;
}

/**
 * Trimite sau înregistrează factura în sistemul Smart Invoice
 */
async function sendInvoiceToSmartInvoice({
  tenantId,
  devizData,
  paymentMethod = 'CARD_STRIPE',
  periodNote = '',
  paymentDate = null,
  isManual = true
}) {
  // 1. Preluare tenant actualizat
  const tRes = await db.query(
    `SELECT id, name, subdomain, vat_number, is_vat_payer, country_code, currency, billing_address, contact_email, is_online_registration
     FROM qrp_tenants 
     WHERE id = $1`,
    [tenantId]
  );

  if (tRes.rows.length === 0) {
    throw new Error(`Tenantul cu ID ${tenantId} nu există.`);
  }

  const tenant = tRes.rows[0];
  const effectivePaymentDate = paymentDate || devizData.payment_date || new Date().toISOString().slice(0, 10);

  // 2. Construcție payload conform standardului Smart Invoice cu curs BNR din ziua plății
  const payload = buildSmartInvoicePayload({
    tenant,
    invoiceLines: devizData.invoice_lines || [],
    exchangeRate: devizData.exchange_rate,
    exchangeRateDate: devizData.exchange_rate_date || effectivePaymentDate,
    tvaPercent: devizData.tva_percent || 21,
    paymentMethod,
    issueDate: effectivePaymentDate,
    paymentDate: effectivePaymentDate,
    periodNote: periodNote || `Abonament Smart QR Pontaj (${devizData.billing_period?.month_name || ''} ${devizData.billing_period?.year || ''})`
  });

  const apiUrl = process.env.SMART_INVOICE_API_URL;
  const apiKey = process.env.SMART_INVOICE_API_KEY;

  let smartInvoiceResult = null;
  let status = 'PREPARED';
  let invoiceNumber = null;
  let pdfUrl = null;

  // 3. Dacă există configurat URL API Smart Invoice extern
  if (apiUrl && apiKey) {
    try {
      const endpoint = apiUrl.includes('/api/v1') 
        ? apiUrl 
        : `${apiUrl.replace(/\/+$/, '')}/api/v1/facturi-emise`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-API-Key': apiKey
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Smart Invoice API a returnat: ${response.status} - ${errText.slice(0, 200)}`);
      }

      smartInvoiceResult = await response.json();
      status = 'SENT';
      invoiceNumber = smartInvoiceResult.invoice_number || smartInvoiceResult.number || smartInvoiceResult.data?.number;
      pdfUrl = smartInvoiceResult.pdf_url || smartInvoiceResult.url || smartInvoiceResult.data?.pdfUrl;
    } catch (apiError) {
      console.error('[SmartInvoiceService] Eroare la trimiterea către API Smart Invoice:', apiError.message);
      status = 'FAILED_API';
      // Nu blocăm procesul; lăsăm factura salvată în baza locală pentru reîncercare
    }
  } else {
    // API extern încă neconfigurat - salvăm devizul gata pregătit
    status = 'READY_FOR_EXPORT';
    invoiceNumber = `${process.env.SMART_INVOICE_SERIES || 'QRP'}-${Date.now().toString().slice(-6)}`;
  }

  // 4. Înregistrare în tabela qrp_invoices
  const insRes = await db.query(
    `INSERT INTO qrp_invoices (
      tenant_id, amount, status, due_date, currency, 
      invoice_number, pdf_url, smart_invoice_status, 
      smart_invoice_sent_at, smart_invoice_payload
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
    ) RETURNING *`,
    [
      tenant.id,
      payload.totals.grand_total,
      payload.invoice_header.is_paid ? 'PAID' : 'UNPAID',
      payload.invoice_header.due_date,
      payload.totals.currency,
      invoiceNumber,
      pdfUrl,
      status,
      new Date(),
      JSON.stringify(payload)
    ]
  );

  return {
    success: true,
    invoice: insRes.rows[0],
    status,
    payload,
    api_connected: Boolean(apiUrl && apiKey),
    message: apiUrl && apiKey 
      ? 'Factura a fost trimisă cu succes către Smart Invoice.' 
      : 'Devizul de facturare a fost generat și pregătit pentru Smart Invoice (date Trade Invest Network S.R.L.).'
  };
}

module.exports = {
  TRADE_INVEST_SUPPLIER,
  isAutoSendEnabled,
  buildSmartInvoicePayload,
  sendInvoiceToSmartInvoice
};
