# Prisma Integration Guide

## 🎯 Overview

Prisma Client is now fully integrated into your project! You can use it to interact with your MongoDB database.

## 📁 Key Files

-   **`utils/prisma.ts`** - Singleton Prisma Client instance (import this!)
-   **`utils/prismaExamples.ts`** - Example CRUD operations for reference
-   **`prisma/schema.prisma`** - Your database schema definition
-   **`prisma.config.ts`** - Prisma configuration

## 🚀 Quick Start

### 1. Import Prisma Client

```typescript
import { prisma } from './utils/prisma';
```

### 2. Use in Your Components/Functions

```typescript
// Example: Fetch a user
const user = await prisma.user.findUnique({
	where: { id: 'some-id' },
});

// Example: Create a user
const newUser = await prisma.user.create({
	data: {
		id: crypto.randomUUID(),
		username: 'TeggTTV',
		email: 'tegg@example.com',
		password: 'hashed-password',
		money: 1000,
	},
});

// Example: Update user money
const updatedUser = await prisma.user.update({
	where: { id: 'some-id' },
	data: {
		money: { increment: 500 },
	},
});
```

## 📋 Common Commands

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Format your schema file
npx prisma format

# Open Prisma Studio (visual database browser)
npx prisma studio

# Push schema changes to database (for development)
npx prisma db push
```

## 🗄️ Current Schema

Your database currently has one model:

```prisma
model User {
  id       String @id @map("_id")
  username String @unique
  email    String @unique
  password String
  money    Float  @default(0)
}
```

## 🔧 Adding New Models

1. Edit `prisma/schema.prisma`
2. Add your new model:

```prisma
model Car {
  id        String   @id @map("_id")
  userId    String
  model     String
  value     Float
  createdAt DateTime @default(now())
}
```

3. Run `npx prisma generate` to update the client
4. Start using the new model: `await prisma.car.create(...)`

## 💡 Best Practices

1. **Always use the singleton instance** from `utils/prisma.ts`
2. **Handle errors** - Wrap database calls in try-catch blocks
3. **Close connections** - Prisma auto-manages connections, but you can call `prisma.$disconnect()` when shutting down
4. **Type safety** - Prisma provides full TypeScript types automatically

## 🔍 Example Usage in React Component

```typescript
import { useEffect, useState } from 'react';
import { prisma } from './utils/prisma';

function UserProfile({ userId }: { userId: string }) {
	const [user, setUser] = useState(null);

	useEffect(() => {
		async function fetchUser() {
			try {
				const userData = await prisma.user.findUnique({
					where: { id: userId },
				});
				setUser(userData);
			} catch (error) {
				console.error('Failed to fetch user:', error);
			}
		}

		fetchUser();
	}, [userId]);

	if (!user) return <div>Loading...</div>;

	return (
		<div>
			<h2>{user.username}</h2>
			<p>Money: ${user.money}</p>
		</div>
	);
}
```

## 📚 Resources

-   [Prisma Documentation](https://www.prisma.io/docs)
-   [MongoDB with Prisma](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
-   [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

## ⚡ Next Steps

Check out `utils/prismaExamples.ts` for more detailed examples of:

-   Creating records
-   Reading/querying data
-   Updating records
-   Deleting records
-   Complex queries with filters and sorting
