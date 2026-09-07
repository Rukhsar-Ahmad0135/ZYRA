/*
 * Copyright (c) - All Rights Reserved.
 *
 * ZYRA AI Fashion Stylist - Pinecone Service
 * Vector storage and retrieval for product RAG
 */

import { Pinecone } from "@pinecone-database/pinecone";

let pinecone = null;

function getPineconeClient() {
  if (!pinecone) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error("PINECONE_API_KEY not configured in .env");
    }
    pinecone = new Pinecone({ apiKey });
  }
  return pinecone;
}

export function getIndexName() {
  return process.env.PINECONE_INDEX_NAME || "zyra-products";
}

export function getNamespace() {
  return process.env.PINECONE_NAMESPACE || "default";
}

export function getTopK() {
  return parseInt(process.env.PINECONE_TOP_K || "20", 10);
}

export async function getIndex() {
  const client = getPineconeClient();
  const indexName = getIndexName();
  return client.index(indexName);
}

export async function queryVectors(queryEmbedding, options = {}) {
  const {
    topK = getTopK(),
    namespace = getNamespace(),
    filter = null,
    includeMetadata = true
  } = options;

  const index = await getIndex();
  
  const queryResponse = await index.query({
    vector: queryEmbedding,
    topK,
    namespace,
    filter,
    includeMetadata,
    includeValues: false
  });

  return queryResponse.matches || [];
}

export async function upsertVectors(vectors, namespace = getNamespace()) {
  const index = await getIndex();
  
  if (vectors.length === 0) {
    return { success: true, upsertedCount: 0 };
  }

  const result = await index.upsert(vectors, namespace);
  
  return {
    success: true,
    upsertedCount: vectors.length,
    result
  };
}

export async function deleteVector(id, namespace = getNamespace()) {
  const index = await getIndex();
  await index.deleteOne(id, namespace);
  return { success: true };
}

export async function deleteAllVectors(namespace = getNamespace()) {
  const index = await getIndex();
  await index.deleteAll(namespace);
  return { success: true };
}

export async function describeIndex() {
  const client = getPineconeClient();
  const indexName = getIndexName();
  
  try {
    const description = await client.describeIndex(indexName);
    return description;
  } catch (error) {
    console.error("Error describing index:", error.message);
    return null;
  }
}

export async function createIndexIfNotExists(dimension = 768) {
  const client = getPineconeClient();
  const indexName = getIndexName();
  
  try {
    const existing = await client.describeIndex(indexName);
    return existing;
  } catch (error) {
    if (error.message.includes("Not found")) {
      console.log(`Creating Pinecone index: ${indexName}`);
      await client.createIndex({
        name: indexName,
        dimension,
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1"
          }
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      return await client.describeIndex(indexName);
    }
    throw error;
  }
}

export default {
  getIndexName,
  getNamespace,
  getTopK,
  getIndex,
  queryVectors,
  upsertVectors,
  deleteVector,
  deleteAllVectors,
  describeIndex,
  createIndexIfNotExists
};
