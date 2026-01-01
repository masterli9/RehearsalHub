import { adminAuth } from "./firebaseAdmin.js";
import pool from "../db/pool.js";

/**
 * Deletes unverified user accounts that are older than the specified days
 * @param {number} daysOld - Number of days after which unverified accounts should be deleted (default: 7)
 * @returns {Promise<{deleted: number, errors: number}>}
 */
export async function cleanupUnverifiedUsers(daysOld = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000); // Firebase uses seconds

    let deletedCount = 0;
    let errorCount = 0;
    let nextPageToken = null;

    console.log(
        `[Cleanup] Starting cleanup of unverified users older than ${daysOld} days (before ${cutoffDate.toISOString()})`
    );

    try {
        do {
            // List users from Firebase Auth (max 1000 per page)
            const listUsersResult = await adminAuth.listUsers(
                1000,
                nextPageToken
            );
            nextPageToken = listUsersResult.pageToken;

            for (const userRecord of listUsersResult.users) {
                try {
                    // Check if user is unverified and old enough
                    const userCreatedAt = userRecord.metadata.creationTime
                        ? Math.floor(
                              new Date(
                                  userRecord.metadata.creationTime
                              ).getTime() / 1000
                          )
                        : 0;

                    if (
                        !userRecord.emailVerified &&
                        userCreatedAt < cutoffTimestamp
                    ) {
                        // Delete from Firebase Auth
                        await adminAuth.deleteUser(userRecord.uid);
                        console.log(
                            `[Cleanup] Deleted Firebase user: ${userRecord.uid} (email: ${userRecord.email})`
                        );

                        // Delete from database
                        try {
                            const dbResult = await pool.query(
                                "DELETE FROM users WHERE firebase_uid = $1",
                                [userRecord.uid]
                            );
                            if (dbResult.rowCount > 0) {
                                console.log(
                                    `[Cleanup] Deleted DB record for user: ${userRecord.uid}`
                                );
                            }
                        } catch (dbError) {
                            console.error(
                                `[Cleanup] Error deleting DB record for ${userRecord.uid}:`,
                                dbError
                            );
                            // Continue even if DB delete fails - Firebase user is already deleted
                        }

                        deletedCount++;
                    }
                } catch (userError) {
                    console.error(
                        `[Cleanup] Error processing user ${userRecord.uid}:`,
                        userError
                    );
                    errorCount++;
                }
            }
        } while (nextPageToken);

        console.log(
            `[Cleanup] Completed. Deleted: ${deletedCount}, Errors: ${errorCount}`
        );
        return { deleted: deletedCount, errors: errorCount };
    } catch (error) {
        console.error("[Cleanup] Fatal error during cleanup:", error);
        throw error;
    }
}
