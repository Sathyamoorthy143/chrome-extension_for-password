/**
 * Conflict resolution for sync conflicts
 */

/**
 * Detect conflicts between local and remote data
 * @param {Array} localItems - Local items
 * @param {Array} remoteItems - Remote items
 * @returns {Array} - Array of conflicts
 */
export function detectConflicts(localItems, remoteItems) {
    const conflicts = [];

    const remoteMap = new Map(remoteItems.map(item => [item.id, item]));

    for (const localItem of localItems) {
        const remoteItem = remoteMap.get(localItem.id);

        if (remoteItem) {
            // Same ID exists in both
            const localTime = new Date(localItem.updatedAt).getTime();
            const remoteTime = new Date(remoteItem.updatedAt).getTime();

            // Check if they're different and have different timestamps
            if (JSON.stringify(localItem) !== JSON.stringify(remoteItem) && localTime !== remoteTime) {
                conflicts.push({
                    id: localItem.id,
                    local: localItem,
                    remote: remoteItem,
                    localTime,
                    remoteTime
                });
            }
        }
    }

    return conflicts;
}

/**
 * Resolve conflicts using last-write-wins strategy
 * @param {Array} conflicts - Array of conflicts
 * @returns {Object} - Resolution result with winners
 */
export function resolveConflictsLastWriteWins(conflicts) {
    const resolved = {
        keepLocal: [],
        keepRemote: []
    };

    for (const conflict of conflicts) {
        if (conflict.localTime > conflict.remoteTime) {
            resolved.keepLocal.push(conflict.local);
        } else {
            resolved.keepRemote.push(conflict.remote);
        }
    }

    return resolved;
}

/**
 * Merge two arrays of items, preferring newer items
 * @param {Array} localItems - Local items
 * @param {Array} remoteItems - Remote items
 * @param {string} strategy - Resolution strategy ('last-write-wins' or 'manual')
 * @returns {Object} - Merged items and conflicts
 */
export function mergeItems(localItems, remoteItems, strategy = 'last-write-wins') {
    const conflicts = detectConflicts(localItems, remoteItems);

    if (conflicts.length === 0) {
        // No conflicts, simple merge
        const localMap = new Map(localItems.map(item => [item.id, item]));
        const remoteMap = new Map(remoteItems.map(item => [item.id, item]));

        // Combine all unique items
        const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);
        const merged = [];

        for (const id of allIds) {
            const local = localMap.get(id);
            const remote = remoteMap.get(id);

            if (local && remote) {
                // Both exist, take newer one
                const localTime = new Date(local.updatedAt).getTime();
                const remoteTime = new Date(remote.updatedAt).getTime();
                merged.push(localTime > remoteTime ? local : remote);
            } else {
                // Only one exists
                merged.push(local || remote);
            }
        }

        return { merged, conflicts: [] };
    }

    // Handle conflicts based on strategy
    if (strategy === 'last-write-wins') {
        const resolution = resolveConflictsLastWriteWins(conflicts);

        // Build merged list
        const conflictIds = new Set(conflicts.map(c => c.id));
        const nonConflictLocal = localItems.filter(item => !conflictIds.has(item.id));
        const nonConflictRemote = remoteItems.filter(item => !conflictIds.has(item.id));

        const merged = [
            ...nonConflictLocal,
            ...nonConflictRemote,
            ...resolution.keepLocal,
            ...resolution.keepRemote
        ];

        // Remove duplicates
        const uniqueMap = new Map(merged.map(item => [item.id, item]));

        return {
            merged: Array.from(uniqueMap.values()),
            conflicts: []
        };
    } else {
        // Manual resolution required
        return {
            merged: localItems, // Keep local for now
            conflicts
        };
    }
}
