-- 02_create_booking_items.sql
-- Migration to add booking_items table and service_type to bookings

-- Add service_type to bookings if it doesn't exist
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) DEFAULT 'Full Service';

-- Create booking_items table
CREATE TABLE IF NOT EXISTS booking_items (
    id CHAR(36) PRIMARY KEY,
    booking_id CHAR(36) NOT NULL,
    menu_item_id CHAR(36) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);
