import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiRequest } from "@/lib/api/client";
import type { AddressValues } from "@/lib/shop/validators";

export type Address = AddressValues & { id: string };
export type Role = "customer" | "admin";

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  addresses: Address[];
  role: Role;
};

type Result =
  | { ok: true; user?: User }
  | { ok: false; error: string };

type ApiUser = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: Role;
  created_at?: string | null;
};

type ApiAddress = {
  id: string;
  full_name: string;
  phone: string;
  pincode: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  address_type: "Home" | "Work";
  is_default: boolean;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
  user: ApiUser;
};

type AuthCtx = {
  ready: boolean;
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  customers: User[];

  adminLogin: (email: string, password: string) => Promise<Result>;
  register: (d: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<Result>;
  login: (
    email: string,
    password: string,
    remember: boolean
  ) => Promise<Result>;

  logout: () => Promise<void>;

  updateProfile: (p: {
    fullName: string;
    phone: string;
  }) => Promise<void>;

  changePassword: (
    current: string,
    next: string
  ) => Promise<Result>;

  saveAddress: (
    a: AddressValues,
    id?: string
  ) => Promise<Address>;

  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

// Convert backend address format to existing frontend format.
function mapAddress(a: ApiAddress): Address {
  return {
    id: a.id,
    fullName: a.full_name,
    phone: a.phone,
    pincode: a.pincode,
    line1: a.line1,
    line2: a.line2,
    landmark: a.landmark,
    city: a.city,
    state: a.state,
    type: a.address_type,
    isDefault: a.is_default,
  };
}

// Convert backend user format to existing frontend format.
function mapUser(
  u: ApiUser,
  addresses: Address[] = []
): User {
  return {
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    createdAt: u.created_at ?? "",
    addresses,
  };
}

// Convert frontend address format to backend format.
function addressPayload(a: AddressValues) {
  return {
    full_name: a.fullName,
    phone: a.phone,
    pincode: a.pincode,
    line1: a.line1,
    line2: a.line2,
    landmark: a.landmark,
    city: a.city,
    state: a.state,
    address_type: a.type,
    is_default: a.isDefault,
  };
}

async function fetchAddresses(): Promise<Address[]> {
  const data = await apiRequest<ApiAddress[]>(
    "/api/auth/addresses/"
  );

  return data.map(mapAddress);
}

async function fetchCurrentUser(): Promise<User> {
  const apiUser = await apiRequest<ApiUser>("/api/auth/me");

  // Addresses are secondary data: if they fail to load, the user is still
  // logged in (otherwise login shows a misleading "invalid token" error).
  let addresses: Address[] = [];
  try {
    addresses = await fetchAddresses();
  } catch (error) {
    console.warn("Could not load addresses", error);
  }

  return mapUser(apiUser, addresses);
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [customers, setCustomers] = useState<User[]>([]);
  const [ready, setReady] = useState(false);

  // Restore the authenticated session after page refresh.
  const refreshCustomers = useCallback(async () => {
    const data = await apiRequest<ApiUser[]>(
      "/api/auth/customers"
    );

    setCustomers(data.map((c) => mapUser(c)));
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser();

      setUser(currentUser);

      if (currentUser.role === "admin") {
        try {
          await refreshCustomers();
        } catch {
          setCustomers([]);
        }
      } else {
        setCustomers([]);
      }
    } catch {
      setUser(null);
      setCustomers([]);
    } finally {
      setReady(true);
    }
  }, [refreshCustomers]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const login = useCallback(
    async (
      email: string,
      password: string,
      _remember: boolean
    ): Promise<Result> => {
      try {
        const body = new URLSearchParams({
          username: email.trim().toLowerCase(),
          password,
        });

        await apiRequest<LoginResponse>("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        });

        const currentUser = await fetchCurrentUser();

        setUser(currentUser);

        if (currentUser.role === "admin") {
          await refreshCustomers();
        } else {
          setCustomers([]);
        }

        return { ok: true, user: currentUser };
      } catch (error) {
        setUser(null);
        return { ok: false, error: errorMessage(error) };
      }
    },
    [refreshCustomers]
  );

  const adminLogin = useCallback(
    async (email: string, password: string): Promise<Result> => {
      const result = await login(email, password, true);

      if (!result.ok) return result;

      if (result.user?.role !== "admin") {
        try {
          await apiRequest("/api/auth/logout", {
            method: "POST",
          });
        } catch {
          // Clear local state even if logout request fails.
        }

        setUser(null);
        setCustomers([]);

        return {
          ok: false,
          error: "Access denied. Admin accounts only.",
        };
      }

      return result;
    },
    [login]
  );

  const register = useCallback(
    async (d: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
    }): Promise<Result> => {
      try {
        const response = await apiRequest<{
          message: string;
          user: ApiUser;
        }>("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: d.fullName.trim(),
            email: d.email.trim().toLowerCase(),
            phone: d.phone.trim(),
            password: d.password,
          }),
        });

        return {
          ok: true,
          user: mapUser(response.user),
        };
      } catch (error) {
        return {
          ok: false,
          error: errorMessage(error),
        };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      setUser(null);
      setCustomers([]);
    }
  }, []);

  const updateProfile = useCallback(
    async (p: { fullName: string; phone: string }) => {
      const updated = await apiRequest<ApiUser>("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: p.fullName.trim(),
          phone: p.phone.trim(),
        }),
      });

      setUser((previous) =>
        previous
          ? {
              ...mapUser(updated, previous.addresses),
            }
          : previous
      );
    },
    []
  );

  const changePassword = useCallback(
    async (current: string, next: string): Promise<Result> => {
      try {
        await apiRequest("/api/auth/change-password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_password: current,
            new_password: next,
          }),
        });

        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: errorMessage(error),
        };
      }
    },
    []
  );

  const saveAddress = useCallback(
    async (a: AddressValues, id?: string): Promise<Address> => {
      const endpoint = id
        ? `/api/auth/addresses/${encodeURIComponent(id)}`
        : "/api/auth/addresses/";

      const saved = await apiRequest<ApiAddress>(endpoint, {
        method: id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addressPayload(a)),
      });

      const address = mapAddress(saved);

      setUser((previous) => {
        if (!previous) return previous;

        const addresses = id
          ? previous.addresses.map((item) =>
              item.id === address.id ? address : {
                ...item,
                isDefault: address.isDefault ? false : item.isDefault,
              }
            )
          : [...previous.addresses, address].map((item) => ({
              ...item,
              isDefault: item.id === address.id
                ? address.isDefault
                : address.isDefault ? false : item.isDefault,
            }));

        return { ...previous, addresses };
      });

      return address;
    },
    []
  );

  const deleteAddress = useCallback(async (id: string) => {
    await apiRequest(
      `/api/auth/addresses/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );

    setUser((previous) => {
      if (!previous) return previous;

      const addresses = previous.addresses.filter(
        (a) => a.id !== id
      );

      return { ...previous, addresses };
    });
  }, []);

  const setDefaultAddress = useCallback(async (id: string) => {
    const address = user?.addresses.find((a) => a.id === id);

    if (!address) {
      throw new Error("Address not found");
    }

    const updated = await apiRequest<ApiAddress>(
      `/api/auth/addresses/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          addressPayload({
            ...address,
            isDefault: true,
          })
        ),
      }
    );

    const savedAddress = mapAddress(updated);

    setUser((previous) =>
      previous
        ? {
            ...previous,
            addresses: previous.addresses.map((a) => ({
              ...a,
              isDefault: a.id === savedAddress.id,
            })),
          }
        : previous
    );
  }, [user]);

  const value = useMemo<AuthCtx>(
    () => ({
      ready,
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      customers,
      adminLogin,
      register,
      login,
      logout,
      updateProfile,
      changePassword,
      saveAddress,
      deleteAddress,
      setDefaultAddress,
    }),
    [
      ready,
      user,
      customers,
      adminLogin,
      register,
      login,
      logout,
      updateProfile,
      changePassword,
      saveAddress,
      deleteAddress,
      setDefaultAddress,
    ]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const context = useContext(Ctx);

  if (!context) {
    throw new Error("AuthProvider missing");
  }

  return context;
}