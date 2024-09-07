import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Hono } from 'hono'
import { z } from 'zod'

export const app = new Hono()

app.get('/', (c) => c.text('Hello Hono!'))

const ZUser = z.object({
    id: z.string(),
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
});
export type User = z.infer<typeof ZUser>;

const dbClient = new DynamoDBClient({
    region: 'eu-west-3',
    credentials: {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy',
        sessionToken: 'dummy',
    },
    
});
const ddbDocClient = DynamoDBDocument.from(dbClient);


app.post('/users', async (c) => {
    const parsedBody = ZUser.safeParse(await c.req.json());
    if (!parsedBody.success) {
        c.status(422);
        return c.json({ error: 'invalid-body', context: parsedBody.error });
    }

    const user = parsedBody.data;

    // save in db
    await ddbDocClient.send(new PutCommand({
        TableName: 'Users',
        Item: user,
    }));

    c.status(201);
    return c.json(user);
});

