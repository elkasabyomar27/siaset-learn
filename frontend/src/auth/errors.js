// Translate known Auth codes without exposing server diagnostics or account existence.
export function authRequestError(error, fallback='The account request failed. Please try again.') {
  const code=error?.code;
  let message=fallback;
  if(code==='email_not_confirmed')message='Confirm your email before signing in. Check your inbox and spam folder, or resend the confirmation below.';
  else if(code==='invalid_credentials')message='The email or password is incorrect. Try again, or reset your password.';
  else if(['over_email_send_rate_limit','over_request_rate_limit','over_email_send_limit'].includes(code)||error?.status===429)message='Too many requests. Please wait a few minutes before trying again.';
  else if(['email_address_not_authorized','email_address_not_authorized_for_send','email_provider_disabled'].includes(code))message='Email delivery is not available for this address yet. Please contact the site owner.';
  else if(code==='weak_password')message='Choose a stronger password with at least 12 characters, including letters, numbers and symbols.';
  else if(code==='email_address_invalid')message='Enter a valid email address.';
  else if(code==='signup_disabled')message='New account registration is currently unavailable.';
  else if(error?.name==='AuthRetryableFetchError')message='The account service could not be reached. Check your connection and try again.';
  return Object.assign(new Error(message),{code});
}
