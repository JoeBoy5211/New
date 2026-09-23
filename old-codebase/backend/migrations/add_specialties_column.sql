-- Migration: Add specialties column to caterers table
-- Run this if your database already exists and doesn't have the specialties column

ALTER TABLE caterers ADD COLUMN specialties TEXT;
