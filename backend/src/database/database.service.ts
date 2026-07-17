import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
    constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) { }

    async query(sql: string, params?: any[]) {
        try {
            return await this.pool.query(sql, params);
        } catch (error) {
            console.error('Database query error:', sql, error);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.pool.end();
    }

    async generateGUID(): Promise<{ guid: string }> {
        let errCounter = 0;
        const generationLimit = 100000;
        const hexArr = '0123456789abcdef'.split('');
        const variantArr = ['8', '9', 'a', 'b'];

        const dbResult = await this.pool.query(`SELECT guid FROM public.cartridges`) as { rows: { guid: string }[] };
        const existingGUIDs = new Set(dbResult.rows.map(row => row.guid?.toLowerCase()));

        let generatedGUID = "";
        let isUnique = false;

        do {
            const guidChars = new Array(36);
            for (let i = 0; i < 36; i++) {
                if ([8, 13, 18, 23].includes(i)) guidChars[i] = '-';
                else if (i === 14) guidChars[i] = '4';
                else if (i === 19) guidChars[i] = variantArr[Math.floor(Math.random() * variantArr.length)];
                else guidChars[i] = hexArr[Math.floor(Math.random() * hexArr.length)];
            }
            generatedGUID = guidChars.join('');
            if (!existingGUIDs.has(generatedGUID)) isUnique = true;
            errCounter++;
        } while (!isUnique && errCounter < generationLimit);

        if (!isUnique) throw new Error('Превышен лимит генерации GUID');
        return { guid: generatedGUID };
    }
}
