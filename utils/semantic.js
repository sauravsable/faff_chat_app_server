const { GoogleGenerativeAI } = require("@google/generative-ai");
const { QdrantClient } = require("@qdrant/js-client-rest");
const { v4: uuidv4 } = require("uuid");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || "";
const COLLECTION = String(process.env.QDRANT_COLLECTION || "messages");

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

const qdrant = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY || undefined,
});

async function ensureCollection(vectorSize = 1536) {
  try {
    await qdrant.getCollection(COLLECTION);
    console.log(`Collection "${COLLECTION}" already exists.`);
  } catch (e) {
    if (e.data?.status?.error?.includes("doesn't exist") || e.response?.status === 404) {
      await qdrant.createCollection(COLLECTION, {
        vectors: { size: vectorSize, distance: "Cosine" },
      });
      console.log(`Created Qdrant collection '${COLLECTION}'`);
    } else {
      throw e;
    }
  }

  try {
    await qdrant.createPayloadIndex(COLLECTION, {
      field_name: "participants",
      field_schema: "keyword",
    });
    console.log("Payload index created for participants");
  } catch (e) {
    if (e.data?.status?.error?.includes("already exists") || e.response?.status === 400) {
      console.log("Payload index already exists for participants");
    } else {
      throw e;
    }
  }
}

async function embedText(text) {
  if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY not set");
  const model = genAI.getGenerativeModel({ model: "embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values; // array of floats
}

async function indexMessageOnQdrant(msg) {
  const vector = await embedText(msg.text);

  await ensureCollection(vector.length);

  const point = {
    id: uuidv4(),
    vector,
    payload: {
      mongoId: String(msg._id),
      text: msg.text,
      senderId: String(msg.senderId),
      receiverId: String(msg.receiverId),
      roomId: msg.roomId,
      participants: [String(msg.senderId), String(msg.receiverId)],
      timestamp: msg.timestamp
        ? new Date(msg.timestamp).toISOString()
        : new Date().toISOString(),
    },
  };

  await qdrant.upsert(COLLECTION, {
    wait: true,
    points: [point],
  });

  return true;
}

async function semanticSearchForUser(userId, query, topK = 10) {
  const vec = await embedText(query);

  const filter = {
    must: [
      {
        key: "participants",
        match: { value: String(userId) },
      },
    ],
  };

  const result = await qdrant.search(COLLECTION, {
    vector: vec,
    limit: topK,
    with_payload: true,
    with_vector: false,
    filter,
  });

  return result; // array of { id, payload, score }
}

module.exports = {
  embedText,
  indexMessageOnQdrant,
  semanticSearchForUser,
};
