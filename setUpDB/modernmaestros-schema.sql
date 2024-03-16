-- Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_type JSONB,
    preferences JSONB,
    firstName VARCHAR(255),
    lastName VARCHAR(255),
    isAdmin BOOLEAN DEFAULT false
);

-- Composers Table 
CREATE TABLE composers (
    composer_id SERIAL PRIMARY KEY,
    user_id INT, -- This column is optional and references the users table
    name VARCHAR(255) NOT NULL,
    biography TEXT,
    website VARCHAR(255),
    social_media_links JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user
      FOREIGN KEY(user_id) 
        REFERENCES users(user_id)
        ON DELETE SET NULL
);


-- Compositions Table
CREATE TABLE compositions (
    composition_id SERIAL PRIMARY KEY,
    composer_id INT REFERENCES composers(composer_id) ON DELETE CASCADE, -- Correct reference to composers
    title VARCHAR(255) NOT NULL,
    year_of_composition INT,
    description TEXT,
    duration VARCHAR(255),
    instrumentation JSONB NOT NULL,
    external_api_name VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, 
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP 
);

-- Performances Table
CREATE TABLE performances (
    performance_id SERIAL PRIMARY KEY,
    composition_id INT REFERENCES compositions(composition_id),
    user_id INT REFERENCES users(user_id),
    recording_date DATE,
    location TEXT,
    file_url TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, 
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP 
);

-- UserInteractions Table
CREATE TABLE user_interactions (
    interaction_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    target_id INT NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'composition', 'performance', or 'composer'
    interaction_type VARCHAR(50) NOT NULL, -- E.g., 'comment', 'rating'
    content TEXT,
    rating INT CHECK (rating >= 1 AND rating <= 5), 
    interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- APIIntegrations Table
CREATE TABLE api_integrations (
    integration_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    api_name VARCHAR(255) NOT NULL,
    api_key TEXT NOT NULL,
    settings JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, 
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP 
);
