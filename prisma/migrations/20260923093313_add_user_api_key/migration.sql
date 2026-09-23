BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[users] ADD [api_key_created_at] DATETIME2,
[api_key_hash] VARCHAR(64);

-- CreateIndex
CREATE NONCLUSTERED INDEX [users_api_key_hash_idx] ON [dbo].[users]([api_key_hash]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
