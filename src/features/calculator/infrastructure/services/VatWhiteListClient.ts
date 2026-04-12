const BASE_URL = 'https://wl-api.mf.gov.pl';

export type VatStatus = 'Czynny' | 'Zwolniony' | 'Niezarejestrowany';

export type VatSubject = {
  name: string;
  nip: string;
  statusVat: VatStatus;
  residenceAddress: string;
  workingAddress: string;
};

export type VatLookupResult =
  | { status: 'found'; subject: VatSubject }
  | { status: 'not-found' }
  | { status: 'invalid-nip' };

type VatSearchResponse = {
  result: {
    subject: VatSubject | null;
    requestDateTime: string;
    requestId: string;
  };
};

export async function fetchVatSubjectByNip(
  nip: string,
  date: string
): Promise<VatLookupResult> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}/api/search/nip/${nip}?date=${date}`, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new Error('Nie można połączyć się z rejestrem VAT. Sprawdź połączenie internetowe.');
  }

  if (response.status === 404) {
    return { status: 'not-found' };
  }

  if (response.status === 400) {
    return { status: 'invalid-nip' };
  }

  if (!response.ok) {
    throw new Error(`Błąd rejestru VAT: ${response.status}`);
  }

  const payload = (await response.json()) as VatSearchResponse;
  const subject = payload.result?.subject;

  if (!subject) {
    return { status: 'not-found' };
  }

  return { status: 'found', subject };
}
