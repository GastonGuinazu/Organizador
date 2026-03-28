-- CreateTable
CREATE TABLE "NoteMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "notePageId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NoteMedia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NoteMedia_notePageId_fkey" FOREIGN KEY ("notePageId") REFERENCES "NotePage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "NoteMedia_userId_idx" ON "NoteMedia"("userId");

-- CreateIndex
CREATE INDEX "NoteMedia_notePageId_idx" ON "NoteMedia"("notePageId");
