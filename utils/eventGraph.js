const PriorityQueue = require('js-priority-queue');

function buildGraph(events) {
  const graph = {};
  
  for (const event of events) {
    const eventId = event.event_id;
    const parentId = event.parent_id; 
    
    if (parentId) {
      if (!graph[parentId]) graph[parentId] = [];
      graph[parentId].push(eventId);
    }
  }
  
  return graph;
}

function findShortestPath(graph, eventMap, sourceId, targetId) {
  
  if (sourceId === targetId) {
    const sourceEvent = eventMap.get(sourceId);
    return {
      path: [sourceId],
      totalDuration: sourceEvent?.duration_minutes || 0
    };
  }

  const visited = new Set();
  const queue = new PriorityQueue({
    comparator: (a, b) => a.totalDuration - b.totalDuration
  });

  queue.queue({
    id: sourceId,
    path: [sourceId],
    totalDuration: eventMap.get(sourceId)?.duration_minutes || 0,
  });

  let shortest = null;

  while (queue.length) {
    const current = queue.dequeue();

    if (visited.has(current.id)) continue;
    visited.add(current.id);

    if (current.id === targetId) {
      shortest = current;
      break;
    }

    const neighbors = graph[current.id] || [];
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        const neighborDuration = eventMap.get(neighborId)?.duration_minutes || 0;
        queue.queue({
          id: neighborId,
          path: [...current.path, neighborId],
          totalDuration: current.totalDuration + neighborDuration,
        });
      }
    }
  }

  return shortest || { path: [], totalDuration: 0 };
}

module.exports = { findShortestPath, buildGraph };
