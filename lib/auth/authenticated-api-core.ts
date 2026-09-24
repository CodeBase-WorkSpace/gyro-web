export type AuthenticatedRequestRetryPolicy = "idempotent" | "never";

export class AuthenticationRequiredError extends Error {
	constructor() {
		super("A valid authenticated session is required.");
		this.name = "AuthenticationRequiredError";
	}
}

export type AuthenticatedRequestDependencies = {
	getAccessToken: () => Promise<string | undefined>;
	refreshAccessToken: () => Promise<string | undefined>;
	isUnauthorizedError: (error: unknown) => boolean;
};

export async function executeAuthenticatedRequest<T>(
	request: (accessToken: string) => Promise<T>,
	dependencies: AuthenticatedRequestDependencies,
	options: { retryPolicy: AuthenticatedRequestRetryPolicy },
): Promise<T> {
	const accessToken = (await dependencies.getAccessToken())
		?? (await dependencies.refreshAccessToken());
	if (!accessToken) throw new AuthenticationRequiredError();

	try {
		return await request(accessToken);
	} catch (error) {
		if (options.retryPolicy !== "idempotent" || !dependencies.isUnauthorizedError(error)) {
			throw error;
		}
		const refreshedAccessToken = await dependencies.refreshAccessToken();
		if (!refreshedAccessToken) throw new AuthenticationRequiredError();
		return request(refreshedAccessToken);
	}
}
