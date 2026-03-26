-- Seed técnicas para todas as academias existentes (seed local, não Flyway)
DO $$
DECLARE
  v_academy_id UUID;
BEGIN
  FOR v_academy_id IN SELECT academy_id FROM academies LOOP
    INSERT INTO techniques (academy_id, name, category, display_order, is_pending)
    VALUES
      (v_academy_id, 'Osoto Gari',       'Básica',    1, FALSE),
      (v_academy_id, 'Ouchi Gari',       'Básica',    2, FALSE),
      (v_academy_id, 'Seoi Nage',        'Básica',    3, FALSE),
      (v_academy_id, 'Tai Otoshi',       'Básica',    4, FALSE),
      (v_academy_id, 'Uki Goshi',        'Básica',    5, FALSE),
      (v_academy_id, 'Koshi Guruma',     'Básica',    6, FALSE),
      (v_academy_id, 'Uchi Mata',        'Avançada', 11, FALSE),
      (v_academy_id, 'Harai Goshi',      'Avançada', 12, FALSE),
      (v_academy_id, 'Tomoe Nage',       'Avançada', 13, FALSE),
      (v_academy_id, 'Kata Guruma',      'Avançada', 14, FALSE),
      (v_academy_id, 'Sumi Gaeshi',      'Avançada', 15, FALSE),
      (v_academy_id, 'Tani Otoshi',      'Avançada', 16, FALSE),
      (v_academy_id, 'Yoko Shiho Gatame','Avançada', 17, FALSE),
      (v_academy_id, 'Juji Gatame',      'Avançada', 18, FALSE),
      (v_academy_id, 'Hadaka Jime',      'Avançada', 19, FALSE),
      (v_academy_id, 'Ippon Seoi Nage',  'Avançada', 20, FALSE),
      (v_academy_id, 'Ko Soto Gari',     'Avançada', 21, FALSE),
      (v_academy_id, 'Ko Uchi Gari',     'Avançada', 22, FALSE),
      (v_academy_id, 'De Ashi Harai',    'Avançada', 23, FALSE),
      (v_academy_id, 'Okuri Ashi Harai', 'Avançada', 24, FALSE),
      (v_academy_id, 'Sasae Tsuri Komi', 'Avançada', 25, FALSE),
      (v_academy_id, 'Ashi Guruma',      'Avançada', 26, FALSE),
      (v_academy_id, 'Kesa Gatame',      'Avançada', 27, FALSE),
      (v_academy_id, 'Tate Shiho Gatame','Avançada', 28, FALSE),
      (v_academy_id, 'Kami Shiho Gatame','Avançada', 29, FALSE),
      (v_academy_id, 'Ura Nage',         'Avançada', 30, FALSE),
      (v_academy_id, 'Sode Tsuri Komi',  'Avançada', 31, FALSE),
      (v_academy_id, 'Morote Seoi Nage', 'Avançada', 32, FALSE),
      (v_academy_id, 'O Guruma',         'Avançada', 33, FALSE)
    ON CONFLICT (academy_id, name, deleted_at) DO NOTHING;
  END LOOP;
END
$$;

SELECT category, count(*) FROM techniques GROUP BY category ORDER BY category;
