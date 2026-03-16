import { Polar } from "@polar-sh/sdk";

export const polar = new Polar({
  accessToken: process.env.POLAR_API_KEY!,
});

export const POLAR_PRO_PRODUCT_ID = process.env.POLAR_PRO_PRODUCT_ID!;
