require('dotenv').config();
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { indexMessageOnQdrant } = require('../utils/semantic');

const connection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, 
});

const worker = new Worker(
  'chat-messages',
  async (job) => {
    const msg = job.data;
    console.log('Processing message for Qdrant:', msg.text);
    await indexMessageOnQdrant(msg);
  },
  { connection }
);

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job.id} failed:`, err));

console.log('BullMQ worker started and listening for jobs...');
