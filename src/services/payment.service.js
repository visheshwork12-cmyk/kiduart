import Stripe from 'stripe';
import config from '@config/index.js';
import logger from '@config/logger.js';
import ApiError from '@utils/apiError.js';
import httpStatus from 'http-status';

const stripe = new Stripe(config.stripe.secretKey);

const createPaymentIntent = async ({ amount, currency = 'usd', metadata }) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      metadata,
    });
    return paymentIntent;
  } catch (error) {
    logger.error(`Failed to create payment intent: ${error.message}`);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment processing failed');
  }
};

const confirmPayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    logger.error(`Failed to confirm payment: ${error.message}`);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment confirmation failed');
  }
};

export default {
  createPaymentIntent,
  confirmPayment,
};