type GoogleUserInfoResponse = {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
};

export async function fetchGoogleUserProfile(accessToken: string) {
  let response: Response;

  try {
    response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    throw new Error('Nie udało się połączyć z Google. Sprawdź połączenie i spróbuj ponownie.');
  }

  if (!response.ok) {
    throw new Error(`Google profile request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as GoogleUserInfoResponse;

  if (!payload.sub || !payload.email || !payload.name) {
    throw new Error('Google nie zwrócił pełnych danych użytkownika.');
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    avatarUrl: payload.picture,
  };
}
