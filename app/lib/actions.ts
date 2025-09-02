// all exported functions within the file marked as Server actions
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

// define server connection
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// validate form's data type usig zod before saving to dbase
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    // change type to number, also validates it
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
})

const CreateInvoice = FormSchema.omit({ id: true, date: true})

export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    // convert amount to cents
    const amountInCents = amount * 100;
    // generate date with YYYY-MM-DD format
    const date = new Date().toISOString().split('T')[0];

    // executes SQL statements
    await sql `
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;

    // clear cache of /dashboard/invoices so fresh data including new invoice is fetched
    revalidatePath('/dashboard/invoices');
    // redirect to /dashboard/invoices upon form submission
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}