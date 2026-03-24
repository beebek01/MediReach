/**
 * eSewa ePay Service
 * Reusable utility for:
 *  - building signed checkout payload
 *  - decoding callback data
 *  - verifying transaction with eSewa status API
 */

const crypto = require('crypto');
const config = require('../config');
const { BadRequestError } = require('../utils/errors');

function normalizeMoney(value) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) return '0.00';
  return parsed.toFixed(2);
}

function buildSignedMessage(fields, signedFieldNames) {
  return signedFieldNames
    .split(',')
    .map((fieldName) => `${fieldName}=${fields[fieldName] ?? ''}`)
    .join(',');
}

function generateSignature(fields, signedFieldNames) {
  const message = buildSignedMessage(fields, signedFieldNames);
  return crypto
    .createHmac('sha256', config.esewa.secretKey)
    .update(message)
    .digest('base64');
}

function decodeEsewaData(encodedData) {
  if (!encodedData) {
    throw new BadRequestError('Missing eSewa callback data');
  }

  try {
    const decodedText = Buffer.from(encodedData, 'base64').toString('utf-8');
    return JSON.parse(decodedText);
  } catch {
    throw new BadRequestError('Invalid eSewa callback data');
  }
}

async function verifyTransactionStatus({ productCode, totalAmount, transactionUuid }) {
  const verifyUrl = new URL(config.esewa.verifyUrl);
  verifyUrl.searchParams.set('product_code', productCode);
  verifyUrl.searchParams.set('total_amount', normalizeMoney(totalAmount));
  verifyUrl.searchParams.set('transaction_uuid', transactionUuid);

  const response = await fetch(verifyUrl.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json, text/plain, */*',
    },
  });

  if (!response.ok) {
    throw new BadRequestError('Unable to verify eSewa transaction status');
  }

  const rawBody = await response.text();
  let parsed;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    parsed = { status: rawBody };
  }

  const statusText = String(parsed.status || parsed.state || '').toUpperCase();
  const isSuccess = ['COMPLETE', 'COMPLETED', 'SUCCESS', 'PAID'].includes(statusText);

  return {
    isSuccess,
    statusText,
    raw: parsed,
  };
}

function buildEsewaFormData({ totalAmount, transactionUuid, successUrl, failureUrl }) {
  const amount = normalizeMoney(totalAmount);
  const taxAmount = '0.00';
  const serviceCharge = '0.00';
  const deliveryCharge = '0.00';
  const totalWithCharges = normalizeMoney(
    Number.parseFloat(amount) + Number.parseFloat(taxAmount) + Number.parseFloat(serviceCharge) + Number.parseFloat(deliveryCharge)
  );

  const formData = {
    amount,
    tax_amount: taxAmount,
    total_amount: totalWithCharges,
    transaction_uuid: transactionUuid,
    product_code: config.esewa.productCode,
    product_service_charge: serviceCharge,
    product_delivery_charge: deliveryCharge,
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
  };

  formData.signature = generateSignature(formData, formData.signed_field_names);
  return formData;
}

module.exports = {
  buildEsewaFormData,
  decodeEsewaData,
  verifyTransactionStatus,
  normalizeMoney,
};
