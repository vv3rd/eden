import { Elysia, t } from 'elysia'
import { edenTreaty } from '../src'

import { beforeAll, describe, expect, it } from 'bun:test'

const utf8Json = { hello: 'world' }

const prefix =
    <Prefix extends string>(prefix: Prefix) =>
    (app: Elysia) =>
        app.get(`${prefix}/prefixed`, () => 'hi')

const app = new Elysia()
    .get('/', () => 'hi')
    .use(prefix('/prefix'))
    .post('/', () => 'hi')
    .get(
        '/json-utf8',
        () =>
            new Response(JSON.stringify(utf8Json), {
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                }
            })
    )
    .post('/mirror', ({ body }) => body, {
        schema: {
            body: t.Object({
                username: t.String(),
                password: t.String()
            })
        }
    })
    .post('/deep/nested/mirror', ({ body }) => body, {
        schema: {
            body: t.Object({
                username: t.String(),
                password: t.String()
            })
        }
    })
    .get('/query', ({ query }) => query)
    .get('/sign-in', ({ query }) => query)
    .group('/v2', (app) => app.guard({}, (app) => app.get('/data', () => 'hi')))
    .get('/number', () => 1)
    .get('/true', () => true)
    .get('/false', () => false)
    .listen(8080)

const client = edenTreaty<typeof app>('http://localhost:8080')

describe('Eden Rest', () => {
    it('get index', async () => {
        const { data } = await client.index.get()

        expect(data).toBe('hi')
    })

    it('post index', async () => {
        const { data } = await client.index.get()

        expect(data).toBe('hi')
    })

    it('post mirror', async () => {
        const body = { username: 'A', password: 'B' }

        const { data } = await client.mirror.post(body)

        expect(data).toEqual(body)
    })

    it('get query', async () => {
        const $query = { username: 'A', password: 'B' }

        const { data } = await client.query.get({
            $query
        })

        expect(data).toEqual($query)
    })

    it('parse number', async () => {
        const { data } = await client.number.get()

        expect(data).toEqual(1)
    })

    it('parse true', async () => {
        const { data } = await client.true.get()

        expect(data).toEqual(true)
    })

    it('parse false', async () => {
        const { data } = await client.false.get()

        expect(data).toEqual(false)
    })

    it('parse json with extra parameters', async () => {
        const { data } = await client['json-utf8'].get()
        expect(data).toEqual(utf8Json)
    })

    // ? Test for type inference
    it('handle group and guard', async () => {
        const { data } = await client.v2.data.get()

        expect(data).toEqual('hi')
    })

    // ? Test for type inference
    it('strictly type plugin prefix', async () => {
        const { data } = await client.prefix.prefixed.get()

        expect(data).toBe('hi')
    })
})