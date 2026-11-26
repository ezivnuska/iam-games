// app/api/tiles/scores/route.ts

import { NextResponse } from 'next/server'
import { withAuth } from '@/app/lib/api/with-auth'
import { withRateLimit, RATE_LIMITS } from '@/app/lib/api/rate-limiter'
import { UserRole } from '@/app/lib/definitions/user'

const parseTime = (time: string): number => {
    const [m, s] = time.split(':').map(Number)
    return m * 60 + s
}

export const GET = withRateLimit(RATE_LIMITS.READ, async () => {
    try {
        const { connectToDatabase } = await import('@/app/lib/mongoose')
        await connectToDatabase()

        const { TileScoreModel } = await import('@iam/db')
        const { default: UserModel } = await import('@/app/lib/models/user')

        const rawScores = await TileScoreModel.find().lean()

        if (rawScores.length === 0) {
            return NextResponse.json({ scores: [] })
        }

        const userIds = [...new Set(rawScores.map(s => s.userId))]
        const users = await UserModel.find({ _id: { $in: userIds } })
            .populate('avatar')
            .lean()

        const userMap = new Map(users.map(u => [u._id.toString(), u]))

        const scores = rawScores
            .map(s => {
                const user = userMap.get(s.userId)
                return {
                    _id: s._id.toString(),
                    score: s.score,
                    createdAt: s.createdAt.toISOString(),
                    user: {
                        id: s.userId,
                        username: s.username,
                        avatar: user?.avatar ?? null,
                    },
                }
            })
            .sort((a, b) => parseTime(a.score) - parseTime(b.score))

        return NextResponse.json({ scores })
    } catch (error) {
        console.error('Error fetching tile scores:', error)
        return NextResponse.json(
            { error: 'Failed to fetch scores' },
            { status: 500 }
        )
    }
})

export const POST = withRateLimit(RATE_LIMITS.GAME_ACTION, withAuth(async (request, _context, user) => {
    try {
        const { score } = await request.json()
        if (!score || typeof score !== 'string') {
            return Response.json({ error: 'score is required' }, { status: 400 })
        }

        const { connectToDatabase } = await import('@/app/lib/mongoose')
        await connectToDatabase()

        const { TileScoreModel } = await import('@iam/db')

        const newScore = await TileScoreModel.create({
            userId: user.id,
            username: user.username,
            score,
        })

        return Response.json({
            score: {
                _id: newScore._id.toString(),
                score: newScore.score,
                createdAt: newScore.createdAt.toISOString(),
                user: {
                    id: user.id,
                    username: user.username,
                    avatar: null,
                },
            }
        })
    } catch (error) {
        console.error('Error saving tile score:', error)
        return Response.json(
            { error: 'Failed to save score' },
            { status: 500 }
        )
    }
}))

export const DELETE = withRateLimit(RATE_LIMITS.DESTRUCTIVE, withAuth(async (_request, _context, user) => {
    if (user.role !== UserRole.Admin) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const { connectToDatabase } = await import('@/app/lib/mongoose')
        await connectToDatabase()

        const { TileScoreModel } = await import('@iam/db')
        await TileScoreModel.deleteMany({})

        return Response.json({ success: true })
    } catch (error) {
        console.error('Error clearing tile scores:', error)
        return Response.json(
            { error: 'Failed to clear scores' },
            { status: 500 }
        )
    }
}))
