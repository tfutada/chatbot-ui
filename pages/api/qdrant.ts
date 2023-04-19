import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleBody, GoogleSource } from '@/types/google';
import { getAnswerFromChatGPT } from './chat_complete';
import {ChatBody} from "@/types/chat";

interface ResultItem {
  score: number;
  payload: {
    body: string;
    url: string;
    publisher?: string;
  };
}

// a handler for Qdrant
export default async function qdrantHandler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
): Promise<any> {
  try {
    const { messages, key, model } = req.body as ChatBody;
    const userMessage = messages[messages.length - 1]; // prompt from user

    // 1. get a vector of the user prompt using OpenAI API
    const vector = await getEmbedding(userMessage.content.trim(), key);

    // 2. get a list of docs that are similar to the vector using Qdrant API
    const sourcesWithText = await fetchContents(vector);

    // 3. get an answer from ChatGPT(OpenAI API) using the augmented prompt
    const answer = await getAnswerFromChatGPT(
      userMessage,
      sourcesWithText,
      key,
      model,
    );

    console.log(answer)

    res.status(200).json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `An error occurred: ${error}` });
  }
}

// fetch a vector of the given text using OpenAI API
async function getEmbedding(title: string, key?: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: title,
      model: 'text-embedding-ada-002',
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding as number[];
}

// fetch similar docs to the given vector from Qdrant search engine
// vector size should be 1536, which is created by OpenAI API
async function fetchContents(
  vector: number[],
  collName: string = 'livedoor-openai-summary',
): Promise<GoogleSource[]> {
  //
  if (vector.length != 1536) {
    throw new Error(`Qdrant vector size should be 1536 but ${vector.length}`);
  }

  const body = {
    vector,
    with_payload: true,
    with_vector: false,
    limit: 3,
  };

  const QDRANT_URL = process.env.QDRANT_API_URL || 'http://localhost:6333';
  const response = await fetch(
    `${QDRANT_URL}/collections/${collName}/points/search`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    throw new Error(`Qdrant error! status: ${response.status}`);
  }

  const data = await response.json();

  return data.result.map((p: ResultItem) => {
    const { body, url } = p.payload;
    console.log(`${p.score} ${url} ${body.substring(0, 50)}`);

    return {
      title: body.substring(0, 800),
      link: url,
      displayLink: url,
      snippet: '',
      image: '',
      text: '',
    };
  });
}
