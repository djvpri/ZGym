-- Add demo fields to Tenant
ALTER TABLE "Tenant" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Tenant" ADD COLUMN "demoExpiresAt" TIMESTAMP(3);
