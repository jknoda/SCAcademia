import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { logAudit } from '../lib/audit';
import {
  getAcademyTechniques,
  getSessionTechniques,
  selectSessionTechnique,
  deselectSessionTechnique,
  addCustomTechnique,
  saveTechniquePreset,
  getProfessorTechniquePresets,
  applyPresetToSession,
  createAcademyTechnique,
  deleteAcademyTechnique,
  reorderSessionTechniques,
} from '../lib/trainingTechniques';

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/academies/:academyId/techniques
 * List all techniques for an academy, grouped by category
 */
export const getAcademyTechniquesHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const academyId = asString(req.params.academyId);
    if (!academyId || !uuidRegex.test(academyId)) {
      return res.status(400).json({ error: 'academyId deve ser um UUID válido' });
    }

    if (academyId !== requester.academyId) {
      return res.status(403).json({ error: 'Acesso negado. Academia não corresponde.' });
    }

    const techniques = await getAcademyTechniques(academyId);

    logAudit(
      requester.userId,
      'TECHNIQUES_LIST_VIEWED',
      'Techniques',
      academyId,
      requester.academyId,
      req.ip
    );

    return res.status(200).json(techniques);
  } catch (error) {
    console.error('Erro ao carregar técnicas da academia:', error);
    return res.status(500).json({ error: 'Erro ao carregar técnicas' });
  }
};

/**
 * POST /api/academies/:academyId/techniques
 * Create a new technique in academy library
 */
export const createAcademyTechniqueHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const academyId = asString(req.params.academyId);
    const name = asString(req.body?.name);
    const description = asString(req.body?.description);
    const category = asString(req.body?.category) as 'Básica' | 'Avançada';

    if (!academyId || !uuidRegex.test(academyId)) {
      return res.status(400).json({ error: 'academyId deve ser um UUID válido' });
    }
    if (academyId !== requester.academyId) {
      return res.status(403).json({ error: 'Acesso negado. Academia não corresponde.' });
    }

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Nome da técnica deve ter pelo menos 2 caracteres' });
    }
    if (name.length > 255) {
      return res.status(400).json({ error: 'Nome da técnica não pode exceder 255 caracteres' });
    }
    if (description.length > 1000) {
      return res.status(400).json({ error: 'Descrição da técnica não pode exceder 1000 caracteres' });
    }
    if (category !== 'Básica' && category !== 'Avançada') {
      return res.status(400).json({ error: 'Categoria deve ser Básica ou Avançada' });
    }

    const technique = await createAcademyTechnique(
      academyId,
      requester.userId,
      name,
      category,
      description || undefined
    );

    logAudit(
      requester.userId,
      'TECHNIQUE_CREATED',
      'Techniques',
      technique.techniqueId,
      requester.academyId,
      req.ip,
      { techniqueName: technique.name, category: technique.category }
    );

    return res.status(201).json({
      message: 'Técnica cadastrada com sucesso',
      technique,
    });
  } catch (error: any) {
    console.error('Erro ao cadastrar técnica:', error);
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Já existe uma técnica com esse nome nesta academia' });
    }
    return res.status(500).json({ error: 'Erro ao cadastrar técnica' });
  }
};

/**
 * DELETE /api/academies/:academyId/techniques/:techniqueId
 * Soft delete an academy technique from catalog
 */
export const deleteAcademyTechniqueHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const academyId = asString(req.params.academyId);
    const techniqueId = asString(req.params.techniqueId);

    if (!academyId || !uuidRegex.test(academyId)) {
      return res.status(400).json({ error: 'academyId deve ser um UUID válido' });
    }
    if (!techniqueId || !uuidRegex.test(techniqueId)) {
      return res.status(400).json({ error: 'techniqueId deve ser um UUID válido' });
    }
    if (academyId !== requester.academyId) {
      return res.status(403).json({ error: 'Acesso negado. Academia não corresponde.' });
    }

    const technique = await deleteAcademyTechnique(academyId, techniqueId);

    logAudit(
      requester.userId,
      'TECHNIQUE_DELETED',
      'Techniques',
      technique.techniqueId,
      requester.academyId,
      req.ip,
      { techniqueName: technique.name, category: technique.category }
    );

    return res.status(200).json({
      message: 'Técnica excluída com sucesso',
      technique,
    });
  } catch (error: any) {
    console.error('Erro ao excluir técnica:', error);
    const message = error?.message || 'Erro ao excluir técnica';
    return res.status(
      message.includes('não encontrada')
        ? 404
        : message.includes('vinculada a treinos ativos')
          ? 409
          : 500
    ).json({ error: message });
  }
};

/**
 * GET /api/trainings/:sessionId/techniques
 * Get techniques selected for a specific training session
 */
export const getSessionTechniquesHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const sessionId = asString(req.params.sessionId);
    if (!sessionId || !uuidRegex.test(sessionId)) {
      return res.status(400).json({ error: 'sessionId deve ser um UUID válido' });
    }

    const result = await getSessionTechniques(requester.academyId, requester.userId, sessionId);

    logAudit(
      requester.userId,
      'SESSION_TECHNIQUES_VIEWED',
      'SessionTechniques',
      sessionId,
      requester.academyId,
      req.ip
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Erro ao carregar técnicas da sessão:', error);
    const message = error?.message || 'Erro ao carregar técnicas da sessão';
    return res.status(error?.message?.includes('não encontrada') ? 404 : 500).json({ error: message });
  }
};

/**
 * POST /api/trainings/:sessionId/techniques
 * Select a technique for a training session
 */
export const selectTechniqueHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const sessionId = asString(req.params.sessionId);
    const techniqueId = asString(req.body?.techniqueId);

    if (!sessionId || !uuidRegex.test(sessionId)) {
      return res.status(400).json({ error: 'sessionId deve ser um UUID válido' });
    }

    if (!techniqueId || !uuidRegex.test(techniqueId)) {
      return res.status(400).json({ error: 'techniqueId deve ser um UUID válido' });
    }

    await selectSessionTechnique(requester.academyId, requester.userId, sessionId, techniqueId);

    const result = await getSessionTechniques(requester.academyId, requester.userId, sessionId);

    logAudit(
      requester.userId,
      'TECHNIQUE_SELECTED',
      'SessionTechniques',
      sessionId,
      requester.academyId,
      req.ip,
      { techniqueId }
    );

    return res.status(200).json({
      message: 'Técnica selecionada com sucesso',
      sessionId,
      techniqueId,
      selectedTechniqueIds: result.selectedTechniqueIds,
      summary: result.summary,
    });
  } catch (error: any) {
    console.error('Erro ao selecionar técnica:', error);
    const message = error?.message || 'Erro ao selecionar técnica';
    return res.status(error?.message?.includes('não encontrada') ? 404 : 500).json({ error: message });
  }
};

/**
 * DELETE /api/trainings/:sessionId/techniques/:techniqueId
 * Deselect a technique from a training session
 */
export const deselectTechniqueHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const sessionId = asString(req.params.sessionId);
    const techniqueId = asString(req.params.techniqueId);

    if (!sessionId || !uuidRegex.test(sessionId)) {
      return res.status(400).json({ error: 'sessionId deve ser um UUID válido' });
    }

    if (!techniqueId || !uuidRegex.test(techniqueId)) {
      return res.status(400).json({ error: 'techniqueId deve ser um UUID válido' });
    }

    await deselectSessionTechnique(requester.academyId, requester.userId, sessionId, techniqueId);

    const result = await getSessionTechniques(requester.academyId, requester.userId, sessionId);

    logAudit(
      requester.userId,
      'TECHNIQUE_DESELECTED',
      'SessionTechniques',
      sessionId,
      requester.academyId,
      req.ip,
      { techniqueId }
    );

    return res.status(200).json({
      message: 'Técnica removida com sucesso',
      sessionId,
      techniqueId,
      selectedTechniqueIds: result.selectedTechniqueIds,
      summary: result.summary,
    });
  } catch (error: any) {
    console.error('Erro ao remover técnica:', error);
    const message = error?.message || 'Erro ao remover técnica';
    return res.status(error?.message?.includes('não encontrada') ? 404 : 500).json({ error: message });
  }
};

/**
 * POST /api/trainings/:sessionId/techniques/custom
 * Add a custom technique to a training session
 */
export const addCustomTechniqueHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const sessionId = asString(req.params.sessionId);
    const techniqueName = asString(req.body?.name);

    if (!sessionId || !uuidRegex.test(sessionId)) {
      return res.status(400).json({ error: 'sessionId deve ser um UUID válido' });
    }

    if (!techniqueName || techniqueName.length < 2) {
      return res.status(400).json({ error: 'Nome da técnica deve ter pelo menos 2 caracteres' });
    }

    if (techniqueName.length > 255) {
      return res.status(400).json({ error: 'Nome da técnica não pode exceder 255 caracteres' });
    }

    const customTechnique = await addCustomTechnique(
      requester.academyId,
      requester.userId,
      sessionId,
      techniqueName
    );

    logAudit(
      requester.userId,
      'CUSTOM_TECHNIQUE_ADDED',
      'SessionTechniques',
      sessionId,
      requester.academyId,
      req.ip,
      { techniqueName }
    );

    return res.status(201).json({
      message: 'Técnica customizada adicionada com sucesso',
      technique: customTechnique,
    });
  } catch (error: any) {
    console.error('Erro ao adicionar técnica customizada:', error);
    const message = error?.message || 'Erro ao adicionar técnica customizada';
    return res.status(error?.message?.includes('não encontrada') ? 404 : 500).json({ error: message });
  }
};

/**
 * POST /api/professors/:professorId/technique-presets
 * Save a technique preset (favorito) for a professor
 */
export const saveTechniquePresetHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    const professorIdParam = asString(req.params.professorId);
    const professorId = requester.role === 'Admin' ? professorIdParam : requester.userId;
    const name = asString(req.body?.name);
    const techniqueIds: string[] = req.body?.techniqueIds || [];

    if (requester.role !== 'Professor' && requester.role !== 'Admin') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    if (requester.role === 'Admin' && (!professorId || !uuidRegex.test(professorId))) {
      return res.status(400).json({ error: 'professorId deve ser um UUID válido' });
    }

    if (requester.role === 'Professor' && professorIdParam && professorIdParam !== requester.userId) {
      return res.status(403).json({ error: 'Acesso negado. Você pode salvar apenas seus próprios favoritos.' });
    }

    if (!uuidRegex.test(professorId)) {
      return res.status(400).json({ error: 'professorId deve ser um UUID válido' });
    }

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Nome do favorito deve ter pelo menos 2 caracteres' });
    }

    if (name.length > 255) {
      return res.status(400).json({ error: 'Nome do favorito não pode exceder 255 caracteres' });
    }

    if (!Array.isArray(techniqueIds) || techniqueIds.length === 0) {
      return res.status(400).json({ error: 'Selecione pelo menos 1 técnica' });
    }

    // Validate all techniqueIds are valid UUIDs
    if (!techniqueIds.every((id) => uuidRegex.test(asString(id)))) {
      return res.status(400).json({ error: 'techniqueIds deve conter UUIDs válidos' });
    }

    const preset = await saveTechniquePreset(professorId, requester.academyId, name, techniqueIds);

    logAudit(
      requester.userId,
      'TECHNIQUE_PRESET_SAVED',
      'TechniquePreset',
      preset.presetId,
      requester.academyId,
      req.ip,
      { presetName: name, techniqueCount: techniqueIds.length }
    );

    return res.status(201).json({
      message: 'Favorito salvo com sucesso',
      preset: {
        presetId: preset.presetId,
        name: preset.name,
        techniqueCount: preset.techniqueIds.length,
        createdAt: preset.createdAt,
      },
    });
  } catch (error) {
    console.error('Erro ao salvar favorito de técnicas:', error);
    return res.status(500).json({ error: 'Erro ao salvar favorito' });
  }
};

/**
 * GET /api/professors/:professorId/technique-presets
 * Get all presets for a professor
 */
export const getProfessorPresetsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    const professorIdParam = asString(req.params.professorId);
    const professorId = requester.role === 'Admin' ? professorIdParam : requester.userId;

    if (requester.role !== 'Professor' && requester.role !== 'Admin') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    if (requester.role === 'Admin' && (!professorId || !uuidRegex.test(professorId))) {
      return res.status(400).json({ error: 'professorId deve ser um UUID válido' });
    }

    if (requester.role === 'Professor' && professorIdParam && professorIdParam !== requester.userId) {
      return res.status(403).json({ error: 'Acesso negado. Você pode visualizar apenas seus próprios favoritos.' });
    }

    if (!uuidRegex.test(professorId)) {
      return res.status(400).json({ error: 'professorId deve ser um UUID válido' });
    }

    const presets = await getProfessorTechniquePresets(professorId, requester.academyId);

    logAudit(
      requester.userId,
      'TECHNIQUE_PRESETS_VIEWED',
      'TechniquePreset',
      professorId,
      requester.academyId,
      req.ip
    );

    return res.status(200).json({ presets });
  } catch (error) {
    console.error('Erro ao carregar favoritos de técnicas:', error);
    return res.status(500).json({ error: 'Erro ao carregar favoritos' });
  }
};

/**
 * POST /api/trainings/:sessionId/apply-preset/:presetId
 * Apply a technique preset to a training session
 */
export const applyPresetHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const sessionId = asString(req.params.sessionId);
    const presetId = asString(req.params.presetId);

    if (!sessionId || !uuidRegex.test(sessionId)) {
      return res.status(400).json({ error: 'sessionId deve ser um UUID válido' });
    }

    if (!presetId || !uuidRegex.test(presetId)) {
      return res.status(400).json({ error: 'presetId deve ser um UUID válido' });
    }

    const result = await applyPresetToSession(requester.academyId, requester.userId, sessionId, presetId);
    const sessionTechniques = await getSessionTechniques(requester.academyId, requester.userId, sessionId);

    logAudit(
      requester.userId,
      'TECHNIQUE_PRESET_APPLIED',
      'SessionTechniques',
      sessionId,
      requester.academyId,
      req.ip,
      { presetId, presetName: result.presetName, techniqueCount: result.selectedTechniqueIds.length }
    );

    return res.status(200).json({
      message: `Favorito '${result.presetName}' aplicado com sucesso`,
      sessionId,
      presetId,
      presetName: result.presetName,
      selectedTechniqueIds: sessionTechniques.selectedTechniqueIds,
      summary: sessionTechniques.summary,
    });
  } catch (error: any) {
    console.error('Erro ao aplicar favorito:', error);
    const message = error?.message || 'Erro ao aplicar favorito';
    return res.status(error?.message?.includes('não encontrada') ? 404 : 500).json({ error: message });
  }
};

/**
 * POST /api/trainings/:sessionId/techniques/reorder
 * Persist ordered selected techniques for a session
 */
export const reorderSessionTechniquesHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requester = req.user!;
    if (requester.role !== 'Professor') {
      return res.status(403).json({ error: 'Acesso negado. Papel insuficiente.' });
    }

    const sessionId = asString(req.params.sessionId);
    const techniqueIds: string[] = Array.isArray(req.body?.techniqueIds) ? req.body.techniqueIds : [];

    if (!sessionId || !uuidRegex.test(sessionId)) {
      return res.status(400).json({ error: 'sessionId deve ser um UUID válido' });
    }

    if (!techniqueIds.length || !techniqueIds.every((id) => uuidRegex.test(asString(id)))) {
      return res.status(400).json({ error: 'techniqueIds deve conter UUIDs válidos' });
    }

    await reorderSessionTechniques(requester.academyId, requester.userId, sessionId, techniqueIds);
    const result = await getSessionTechniques(requester.academyId, requester.userId, sessionId);

    logAudit(
      requester.userId,
      'SESSION_TECHNIQUES_REORDERED',
      'SessionTechniques',
      sessionId,
      requester.academyId,
      req.ip,
      { count: techniqueIds.length }
    );

    return res.status(200).json({
      message: 'Ordem das técnicas atualizada',
      sessionId,
      selectedTechniqueIds: result.selectedTechniqueIds,
      summary: result.summary,
    });
  } catch (error: any) {
    console.error('Erro ao reordenar técnicas da sessão:', error);
    const message = error?.message || 'Erro ao reordenar técnicas da sessão';
    return res.status(error?.message?.includes('inválida') ? 400 : 500).json({ error: message });
  }
};
