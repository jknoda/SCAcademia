import { Response } from 'express';

import { AuthenticatedRequest } from '../types';

const getAiApiBaseUrl = (): string => {
  const rawUrl = process.env.AI_API_URL?.trim();
  if (!rawUrl) {
    throw Object.assign(new Error('AI_API_URL não configurada no ambiente.'), { status: 500 });
  }

  return rawUrl.replace(/\/$/, '');
};

const asNonEmptyString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const proxyAiRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  path: string,
  body: Record<string, unknown>
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const response = await fetch(`${getAiApiBaseUrl()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const rawText = await response.text();
    let parsedBody: any = {};

    if (rawText) {
      try {
        parsedBody = JSON.parse(rawText);
      } catch {
        parsedBody = { error: rawText };
      }
    }

    if (!response.ok) {
      return res.status(response.status).json(
        parsedBody && typeof parsedBody === 'object'
          ? parsedBody
          : { error: 'Erro ao comunicar com a API de IA.' }
      );
    }

    return res.status(response.status).json(parsedBody);
  } catch (error) {
    console.error('Erro ao acessar API de IA:', error);
    return res.status(502).json({ error: 'Não foi possível comunicar com a API de IA.' });
  }
};

export const lookupAiUserHandler = async (req: AuthenticatedRequest, res: Response) => {
  const email = asNonEmptyString(req.body?.email);
  if (!email) {
    return res.status(400).json({ error: 'email é obrigatório' });
  }

  return proxyAiRequest(req, res, '/users', { email });
};

export const initAiChatHandler = async (req: AuthenticatedRequest, res: Response) => {
  const userId = asNonEmptyString(req.body?.userId);
  if (!userId) {
    return res.status(400).json({ error: 'userId é obrigatório' });
  }

  return proxyAiRequest(req, res, '/chat/init', { userId });
};

export const sendAiChatMessageHandler = async (req: AuthenticatedRequest, res: Response) => {
  const userId = asNonEmptyString(req.body?.userId);
  const text = asNonEmptyString(req.body?.text);

  if (!userId) {
    return res.status(400).json({ error: 'userId é obrigatório' });
  }

  if (!text) {
    return res.status(400).json({ error: 'text é obrigatório' });
  }

  return proxyAiRequest(req, res, '/chat', { userId, text });
};