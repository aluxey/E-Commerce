/**
 * Error mappers for Supabase authentication errors
 * Provides user-friendly, translatable error messages
 */

/**
 * Map Supabase signup errors to translation keys
 * @param {object} error - Supabase error object
 * @param {function} t - Translation function
 * @returns {string} - Translated error message
 */
export const mapSignupError = (error, t) => {
  if (!error) return '';
  
  const msg = error.message?.toLowerCase() || '';
  
  if (msg.includes('already registered') || msg.includes('user already registered')) {
    return t('signup.errors.alreadyUsed', 'Cet email est déjà utilisé.');
  }
  if (msg.includes('invalid email')) {
    return t('signup.errors.invalidEmail', 'Email invalide.');
  }
  if (msg.includes('password')) {
    return t('signup.errors.passwordWeak', 'Mot de passe trop faible.');
  }
  
  // Fallback générique
  return t('signup.errors.fallback', 'Une erreur est survenue. Veuillez réessayer.');
};

/**
 * Map Supabase login errors to translation keys
 * @param {object} error - Supabase error object
 * @param {function} t - Translation function
 * @returns {string} - Translated error message
 */
export const mapLoginError = (error, t) => {
  if (!error) return '';
  
  const msg = error.message?.toLowerCase() || '';
  
  if (msg.includes('invalid login credentials') || msg.includes('invalid password')) {
    return t('login.errors.invalidCredentials', 'Identifiants invalides.');
  }
  if (msg.includes('user not found') || msg.includes('no user found')) {
    return t('login.errors.notFound', 'Utilisateur non trouvé.');
  }
  if (msg.includes('email not confirmed')) {
    return t('login.errors.emailNotConfirmed', 'Email non confirmé. Vérifiez votre boîte mail.');
  }
  if (msg.includes('too many requests')) {
    return t('login.errors.tooManyRequests', 'Trop de tentatives. Réessayez plus tard.');
  }
  
  // Fallback générique
  return t('login.errors.fallback', 'Une erreur est survenue. Veuillez réessayer.');
};

/**
 * Generic Supabase error mapper (for other operations)
 * @param {object} error - Supabase error object
 * @param {function} t - Translation function (optional)
 * @returns {string} - Error message
 */
export const mapSupabaseError = (error, t = null) => {
  if (!error) return '';
  
  const msg = error.message?.toLowerCase() || '';
  
  // Common Supabase errors
  if (msg.includes('network') || msg.includes('fetch')) {
    return t ? t('errors.network', 'Erreur réseau. Vérifiez votre connexion.') : 'Erreur réseau.';
  }
  if (msg.includes('unauthorized') || msg.includes('jwt')) {
    return t ? t('errors.unauthorized', 'Session expirée. Reconnectez-vous.') : 'Non autorisé.';
  }
  if (msg.includes('not found')) {
    return t ? t('errors.notFound', 'Ressource non trouvée.') : 'Non trouvé.';
  }
  if (msg.includes('duplicate') || msg.includes('unique')) {
    return t ? t('errors.duplicate', 'Cette entrée existe déjà.') : 'Doublon.';
  }
  
  // Return original message if no mapping found
  return error.message || (t ? t('errors.unknown', 'Erreur inconnue.') : 'Erreur inconnue.');
};
