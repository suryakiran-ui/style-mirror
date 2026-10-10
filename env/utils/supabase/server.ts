import { createServerClient } from "@supabase/ssr";

type CookieOptions = {
  expires?: Date;
  httpOnly?: boolean;
  path?: string;
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
};

type Cookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

type CookieStore = {
  getAll(): Cookie[];
  set(name: string, value: string, options?: CookieOptions): void;
};

declare const process: {
  env: Record<string, string | undefined>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = (cookieStore: CookieStore) => {
  return createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Cookie[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};