-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  user_id INTEGER REFERENCES auth.users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  addition DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(50) NOT NULL,
  installments INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending',
  type VARCHAR(20) DEFAULT 'sale',
  notes TEXT,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  change DECIMAL(10,2) DEFAULT 0,
  client_cpf VARCHAR(20),
  client_name VARCHAR(100),
  plate VARCHAR(10),
  table_number INTEGER,
  command_number INTEGER,
  waiter_id INTEGER,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  service_fee DECIMAL(10,2) DEFAULT 0,
  service_percentage DECIMAL(5,2) DEFAULT 0,
  nfe_key VARCHAR(44),
  nfe_number INTEGER,
  nfe_status VARCHAR(20),
  nfe_date TIMESTAMP,
  nfe_time VARCHAR(8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_sales_client_id ON sales(client_id);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sales_updated_at 
    BEFORE UPDATE ON sales 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
