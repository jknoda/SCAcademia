import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { getUserById, getUsersByAcademy, getAcademyById } from '../lib/database';

export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.params['userId'] as string;
    const callerAcademyId = req.user!.academyId;

    const user = await getUserById(userId);
    if (!user || user.academyId !== callerAcademyId) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      academyId: user.academyId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar perfil do usuário' });
  }
};

export const listAcademyUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const users = await getUsersByAcademy(academyId);

    res.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        academyId: u.academyId,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
};

export const getAcademyInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const academyId = req.user!.academyId;
    const academy = await getAcademyById(academyId);
    if (!academy) {
      return res.status(404).json({ error: 'Academia não encontrada' });
    }
    res.json({ id: academy.id, name: academy.name });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar informações da academia' });
  }
};
