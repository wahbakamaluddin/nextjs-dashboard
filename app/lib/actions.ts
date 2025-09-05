// all exported functions within the file marked as Server actions
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import { error } from 'console';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

// define server connection
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// validate form's data type usig zod before saving to dbase
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    // .coerce change type to number, also validates it
    amount: z.coerce
        .number()
        .gt(0, { message: 'Please enter an amount greater that $0.' }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
})

const CreateInvoice = FormSchema.omit({ id: true, date: true})

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
}

// createInvoice() accept formData and prevState(contains state passsed from useActionState)
export async function createInvoice(prevState: State, formData: FormData) {

    // validate form fields using Zod
    // safeParsr() return object containing success or error field
    const validateFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })

    // if form validation returns fails, return error
    if (!validateFields.success) {
        return {
            errors: validateFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        }
    }

    const { customerId, amount, status } = validateFields.data;
    // convert amount to cents
    const amountInCents = amount * 100;
    // generate date with YYYY-MM-DD format
    const date = new Date().toISOString().split('T')[0];

    // executes SQL statements
    try {
        await sql `
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
    } catch (error) {
        console.log('error')
        return {
            message: 'Database Error: Failed to Create Invoice'
        }
    }

    // clear cache of /dashboard/invoices so fresh data including new invoice is fetched
    revalidatePath('/dashboard/invoices');
    // redirect to /dashboard/invoices upon form submission
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
     
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
            revalidatePath('/dashboard/invoices');
    } catch (error) {
        console.log('Error')
    }

}

export async function authenticate(
 prevState: string | undefined,
 formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong';
            }
        }
        throw error;
    }
}