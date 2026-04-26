-- Create database if not exists
CREATE DATABASE IF NOT EXISTS catering_db;
USE catering_db;

-- Users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY, -- UUID
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verification Codes for Signup & Password Reset
CREATE TABLE IF NOT EXISTS verification_codes (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose ENUM('signup', 'reset') NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_purpose (email, purpose)
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id CHAR(36) PRIMARY KEY, -- UUID
    user_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Roles
CREATE TABLE IF NOT EXISTS user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    role ENUM('customer', 'vendor', 'admin') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_role (user_id, role),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cuisine Categories
CREATE TABLE IF NOT EXISTS cuisine_categories (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event Types
CREATE TABLE IF NOT EXISTS event_types (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Caterers
CREATE TABLE IF NOT EXISTS caterers (
    id CHAR(36) PRIMARY KEY,
    vendor_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    description TEXT,
    long_description TEXT,
    location VARCHAR(255),
    cuisines TEXT, -- Comma-separated or JSON
    event_types TEXT, -- Comma-separated or JSON
    specialties TEXT, -- Comma-separated or JSON
    rating DECIMAL(2,1) DEFAULT 0,
    review_count INT DEFAULT 0,
    page_views INT DEFAULT 0,
    price_range ENUM('$', '$$', '$$$', '$$$$'),
    min_guests INT,
    max_guests INT,
    years_in_business INT DEFAULT 0,
    cover_image TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    is_pending BOOLEAN DEFAULT TRUE,
    approved_by CHAR(36),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
    id CHAR(36) PRIMARY KEY,
    caterer_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    image TEXT,
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (caterer_id) REFERENCES caterers(id) ON DELETE CASCADE
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id CHAR(36) PRIMARY KEY,
    customer_id CHAR(36) NOT NULL,
    caterer_id CHAR(36) NOT NULL,
    event_date DATE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    guest_count INT NOT NULL,
    service_type VARCHAR(50) DEFAULT 'Full Service',
    status ENUM('pending_review', 'accepted', 'completed', 'declined') DEFAULT 'pending_review',
    special_requests TEXT,
    total_amount DECIMAL(10,2),
    venue VARCHAR(255),
    tx_ref VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (caterer_id) REFERENCES caterers(id) ON DELETE CASCADE
);

-- Booking Items
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

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id CHAR(36) PRIMARY KEY,
    customer_id CHAR(36) NOT NULL,
    caterer_id CHAR(36) NOT NULL,
    booking_id CHAR(36),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (caterer_id) REFERENCES caterers(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    caterer_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_favorite (user_id, caterer_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (caterer_id) REFERENCES caterers(id) ON DELETE CASCADE
);

-- Promotions table (feed)
CREATE TABLE IF NOT EXISTS promotions (
    id CHAR(36) PRIMARY KEY,
    caterer_id CHAR(36) NOT NULL,
    media_url TEXT NOT NULL,
    media_type ENUM('image', 'video') NOT NULL,
    caption TEXT,
    tags TEXT,
    shares_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (caterer_id) REFERENCES caterers(id) ON DELETE CASCADE
);

-- Promotion Likes
CREATE TABLE IF NOT EXISTS promotion_likes (
    user_id CHAR(36) NOT NULL,
    promotion_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, promotion_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE
);

-- Promotion Saves (Bookmarks)
CREATE TABLE IF NOT EXISTS promotion_saves (
    user_id CHAR(36) NOT NULL,
    promotion_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, promotion_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE
);

-- Caterer Follows
CREATE TABLE IF NOT EXISTS caterer_follows (
    follower_id CHAR(36) NOT NULL,
    caterer_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, caterer_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (caterer_id) REFERENCES caterers(id) ON DELETE CASCADE
);

-- Promotion Comments
CREATE TABLE IF NOT EXISTS promotion_comments (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    promotion_id CHAR(36) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE
);

-- Seed Data (Optional)
INSERT INTO cuisine_categories (id, name) VALUES 
(UUID(), 'Italian'), (UUID(), 'French'), (UUID(), 'Japanese'), (UUID(), 'Indian'), 
(UUID(), 'Mexican'), (UUID(), 'Mediterranean'), (UUID(), 'American'), (UUID(), 'BBQ'), 
(UUID(), 'Seafood'), (UUID(), 'Vegetarian'), (UUID(), 'Vegan'), (UUID(), 'Asian Fusion');

INSERT INTO event_types (id, name) VALUES
(UUID(), 'Wedding'), (UUID(), 'Corporate'), (UUID(), 'Private Party'), (UUID(), 'Anniversary'),
(UUID(), 'Birthday'), (UUID(), 'Gala'), (UUID(), 'Festival');

-- Default Admin User
-- Password: admin123
SET @admin_id = UUID();
INSERT INTO users (id, email, password_hash) VALUES 
(@admin_id, 'admin@admin.com', '$2b$10$A4xbQKqZEw73TpJUCAmCaO7EWwHNQqqBbh1fqayhmMo0OrL0R2e6q'); -- Password: admin123

INSERT INTO user_roles (user_id, role) VALUES 
(@admin_id, 'admin');

INSERT INTO profiles (id, user_id, name, email) VALUES 
(UUID(), @admin_id, 'Super Admin', 'admin@admin.com');

-- Default Vendor User
-- Password: vendor123
SET @vendor_id = UUID();
INSERT INTO users (id, email, password_hash) VALUES 
(@vendor_id, 'vendor@demo.com', '$2b$10$A4xbQKqZEw73TpJUCAmCaO7EWwHNQqqBbh1fqayhmMo0OrL0R2e6q'); -- Password: demo123

INSERT INTO user_roles (user_id, role) VALUES 
(@vendor_id, 'vendor');

INSERT INTO profiles (id, user_id, name, email, phone) VALUES 
(UUID(), @vendor_id, 'Demo Vendor', 'vendor@demo.com', '555-123-4567');

INSERT INTO caterers (id, vendor_id, name, email, description, long_description, location, cuisines, event_types, price_range, min_guests, max_guests, is_approved, is_pending, cover_image) VALUES 
(UUID(), @vendor_id, 'Elite Catering', 'vendor@demo.com', 'Premium catering services for all occasions.', 'We provide the highest quality catering services since 2010. Our chefs are trained in international cuisines.', 'San Francisco, CA', 'Italian,French,Mediterranean', 'Wedding,Corporate,Private Party', '$$$', 10, 500, 1, 0, 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800');
