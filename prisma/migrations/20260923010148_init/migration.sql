BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(120) NOT NULL,
    [email] NVARCHAR(255) NOT NULL,
    [password_hash] VARCHAR(255) NOT NULL,
    [role] VARCHAR(20) NOT NULL CONSTRAINT [users_role_df] DEFAULT 'OPERATOR',
    [is_active] BIT NOT NULL CONSTRAINT [users_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [users_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[categories] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(80) NOT NULL,
    [description] NVARCHAR(500),
    [is_active] BIT NOT NULL CONSTRAINT [categories_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [categories_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [categories_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [categories_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[suppliers] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(150) NOT NULL,
    [contact_name] NVARCHAR(120),
    [email] NVARCHAR(255),
    [phone] VARCHAR(30),
    [address] NVARCHAR(255),
    [tax_id] VARCHAR(30),
    [is_active] BIT NOT NULL CONSTRAINT [suppliers_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [suppliers_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [suppliers_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[warehouses] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    [code] VARCHAR(10) NOT NULL,
    [address] NVARCHAR(255),
    [is_active] BIT NOT NULL CONSTRAINT [warehouses_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [warehouses_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [warehouses_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [warehouses_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[products] (
    [id] NVARCHAR(1000) NOT NULL,
    [sku] VARCHAR(40) NOT NULL,
    [barcode] VARCHAR(50),
    [name] NVARCHAR(200) NOT NULL,
    [description] NVARCHAR(1000),
    [category_id] NVARCHAR(1000) NOT NULL,
    [supplier_id] NVARCHAR(1000),
    [unit] VARCHAR(20) NOT NULL CONSTRAINT [products_unit_df] DEFAULT 'unidad',
    [cost_price] DECIMAL(12,2) NOT NULL CONSTRAINT [products_cost_price_df] DEFAULT 0,
    [sale_price] DECIMAL(12,2) NOT NULL CONSTRAINT [products_sale_price_df] DEFAULT 0,
    [avg_cost] DECIMAL(12,4) NOT NULL CONSTRAINT [products_avg_cost_df] DEFAULT 0,
    [min_stock] INT NOT NULL CONSTRAINT [products_min_stock_df] DEFAULT 0,
    [max_stock] INT,
    [image_url] VARCHAR(500),
    [is_active] BIT NOT NULL CONSTRAINT [products_is_active_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [products_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [products_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [products_sku_key] UNIQUE NONCLUSTERED ([sku])
);

-- CreateTable
CREATE TABLE [dbo].[stocks] (
    [product_id] NVARCHAR(1000) NOT NULL,
    [warehouse_id] NVARCHAR(1000) NOT NULL,
    [quantity] INT NOT NULL CONSTRAINT [stocks_quantity_df] DEFAULT 0,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [stocks_pkey] PRIMARY KEY CLUSTERED ([product_id],[warehouse_id])
);

-- CreateTable
CREATE TABLE [dbo].[stock_movements] (
    [id] NVARCHAR(1000) NOT NULL,
    [type] VARCHAR(20) NOT NULL,
    [product_id] NVARCHAR(1000) NOT NULL,
    [from_warehouse_id] NVARCHAR(1000),
    [to_warehouse_id] NVARCHAR(1000),
    [quantity] INT NOT NULL,
    [unit_cost] DECIMAL(12,4),
    [reason] NVARCHAR(255),
    [reference] VARCHAR(60),
    [user_id] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [stock_movements_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [stock_movements_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[purchase_orders] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] VARCHAR(20) NOT NULL,
    [supplier_id] NVARCHAR(1000) NOT NULL,
    [warehouse_id] NVARCHAR(1000) NOT NULL,
    [status] VARCHAR(30) NOT NULL CONSTRAINT [purchase_orders_status_df] DEFAULT 'DRAFT',
    [expected_date] DATETIME2,
    [notes] NVARCHAR(1000),
    [created_by_id] NVARCHAR(1000) NOT NULL,
    [sent_at] DATETIME2,
    [received_at] DATETIME2,
    [cancelled_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [purchase_orders_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [purchase_orders_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [purchase_orders_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[purchase_order_items] (
    [id] NVARCHAR(1000) NOT NULL,
    [purchase_order_id] NVARCHAR(1000) NOT NULL,
    [product_id] NVARCHAR(1000) NOT NULL,
    [quantity_ordered] INT NOT NULL,
    [quantity_received] INT NOT NULL CONSTRAINT [purchase_order_items_quantity_received_df] DEFAULT 0,
    [unit_cost] DECIMAL(12,4) NOT NULL,
    CONSTRAINT [purchase_order_items_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [purchase_order_items_purchase_order_id_product_id_key] UNIQUE NONCLUSTERED ([purchase_order_id],[product_id])
);

-- CreateTable
CREATE TABLE [dbo].[audit_logs] (
    [id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000),
    [action] VARCHAR(20) NOT NULL,
    [entity] VARCHAR(50) NOT NULL,
    [entity_id] VARCHAR(64) NOT NULL,
    [before] NVARCHAR(max),
    [after] NVARCHAR(max),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [audit_logs_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [audit_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [users_role_idx] ON [dbo].[users]([role]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [users_is_active_idx] ON [dbo].[users]([is_active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [categories_is_active_idx] ON [dbo].[categories]([is_active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [suppliers_name_idx] ON [dbo].[suppliers]([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [suppliers_tax_id_idx] ON [dbo].[suppliers]([tax_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [suppliers_is_active_idx] ON [dbo].[suppliers]([is_active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [warehouses_is_active_idx] ON [dbo].[warehouses]([is_active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [products_name_idx] ON [dbo].[products]([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [products_barcode_idx] ON [dbo].[products]([barcode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [products_category_id_idx] ON [dbo].[products]([category_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [products_supplier_id_idx] ON [dbo].[products]([supplier_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [products_is_active_idx] ON [dbo].[products]([is_active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [products_created_at_idx] ON [dbo].[products]([created_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stocks_warehouse_id_idx] ON [dbo].[stocks]([warehouse_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stock_movements_created_at_idx] ON [dbo].[stock_movements]([created_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stock_movements_product_id_created_at_idx] ON [dbo].[stock_movements]([product_id], [created_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stock_movements_type_idx] ON [dbo].[stock_movements]([type]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stock_movements_user_id_idx] ON [dbo].[stock_movements]([user_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stock_movements_from_warehouse_id_idx] ON [dbo].[stock_movements]([from_warehouse_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stock_movements_to_warehouse_id_idx] ON [dbo].[stock_movements]([to_warehouse_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stock_movements_reference_idx] ON [dbo].[stock_movements]([reference]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [purchase_orders_status_idx] ON [dbo].[purchase_orders]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [purchase_orders_supplier_id_idx] ON [dbo].[purchase_orders]([supplier_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [purchase_orders_warehouse_id_idx] ON [dbo].[purchase_orders]([warehouse_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [purchase_orders_created_at_idx] ON [dbo].[purchase_orders]([created_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [purchase_order_items_product_id_idx] ON [dbo].[purchase_order_items]([product_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [audit_logs_created_at_idx] ON [dbo].[audit_logs]([created_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [audit_logs_entity_entity_id_idx] ON [dbo].[audit_logs]([entity], [entity_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [audit_logs_user_id_idx] ON [dbo].[audit_logs]([user_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [audit_logs_action_idx] ON [dbo].[audit_logs]([action]);

-- AddForeignKey
ALTER TABLE [dbo].[products] ADD CONSTRAINT [products_category_id_fkey] FOREIGN KEY ([category_id]) REFERENCES [dbo].[categories]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[products] ADD CONSTRAINT [products_supplier_id_fkey] FOREIGN KEY ([supplier_id]) REFERENCES [dbo].[suppliers]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[stocks] ADD CONSTRAINT [stocks_product_id_fkey] FOREIGN KEY ([product_id]) REFERENCES [dbo].[products]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[stocks] ADD CONSTRAINT [stocks_warehouse_id_fkey] FOREIGN KEY ([warehouse_id]) REFERENCES [dbo].[warehouses]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[stock_movements] ADD CONSTRAINT [stock_movements_product_id_fkey] FOREIGN KEY ([product_id]) REFERENCES [dbo].[products]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[stock_movements] ADD CONSTRAINT [stock_movements_from_warehouse_id_fkey] FOREIGN KEY ([from_warehouse_id]) REFERENCES [dbo].[warehouses]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[stock_movements] ADD CONSTRAINT [stock_movements_to_warehouse_id_fkey] FOREIGN KEY ([to_warehouse_id]) REFERENCES [dbo].[warehouses]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[stock_movements] ADD CONSTRAINT [stock_movements_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[purchase_orders] ADD CONSTRAINT [purchase_orders_supplier_id_fkey] FOREIGN KEY ([supplier_id]) REFERENCES [dbo].[suppliers]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[purchase_orders] ADD CONSTRAINT [purchase_orders_warehouse_id_fkey] FOREIGN KEY ([warehouse_id]) REFERENCES [dbo].[warehouses]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[purchase_orders] ADD CONSTRAINT [purchase_orders_created_by_id_fkey] FOREIGN KEY ([created_by_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[purchase_order_items] ADD CONSTRAINT [purchase_order_items_purchase_order_id_fkey] FOREIGN KEY ([purchase_order_id]) REFERENCES [dbo].[purchase_orders]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[purchase_order_items] ADD CONSTRAINT [purchase_order_items_product_id_fkey] FOREIGN KEY ([product_id]) REFERENCES [dbo].[products]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[audit_logs] ADD CONSTRAINT [audit_logs_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;


-- CheckConstraints (el conector sqlserver de Prisma no soporta enums: se validan los valores en la BD)
ALTER TABLE [dbo].[users] ADD CONSTRAINT [users_role_check]
    CHECK ([role] IN ('ADMIN', 'MANAGER', 'OPERATOR'));

ALTER TABLE [dbo].[stock_movements] ADD CONSTRAINT [stock_movements_type_check]
    CHECK ([type] IN ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER'));

ALTER TABLE [dbo].[stock_movements] ADD CONSTRAINT [stock_movements_quantity_check]
    CHECK ([quantity] > 0);

-- Cada tipo de movimiento exige una combinacion concreta de almacenes
ALTER TABLE [dbo].[stock_movements] ADD CONSTRAINT [stock_movements_warehouses_check]
    CHECK (
        ([type] = 'IN'        AND [from_warehouse_id] IS NULL     AND [to_warehouse_id] IS NOT NULL) OR
        ([type] = 'OUT'       AND [from_warehouse_id] IS NOT NULL AND [to_warehouse_id] IS NULL) OR
        ([type] = 'TRANSFER'  AND [from_warehouse_id] IS NOT NULL AND [to_warehouse_id] IS NOT NULL AND [from_warehouse_id] <> [to_warehouse_id]) OR
        ([type] = 'ADJUSTMENT' AND (([from_warehouse_id] IS NULL AND [to_warehouse_id] IS NOT NULL) OR ([from_warehouse_id] IS NOT NULL AND [to_warehouse_id] IS NULL)))
    );

ALTER TABLE [dbo].[stocks] ADD CONSTRAINT [stocks_quantity_check]
    CHECK ([quantity] >= 0);

ALTER TABLE [dbo].[purchase_orders] ADD CONSTRAINT [purchase_orders_status_check]
    CHECK ([status] IN ('DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'));

ALTER TABLE [dbo].[purchase_order_items] ADD CONSTRAINT [purchase_order_items_quantities_check]
    CHECK ([quantity_ordered] > 0 AND [quantity_received] >= 0 AND [quantity_received] <= [quantity_ordered]);

ALTER TABLE [dbo].[audit_logs] ADD CONSTRAINT [audit_logs_action_check]
    CHECK ([action] IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
