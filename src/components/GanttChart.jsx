import React, { useMemo, useState } from 'react';
import './GanttChart.css';

export function GanttChart({ tasks, date }) {
    const [hoveredTask, setHoveredTask] = useState(null);

    // Process tasks to calculate positioning
    const processedTasks = useMemo(() => {
        if (!tasks || tasks.length === 0) return [];

        // Define start and end of the day (e.g., 9:00 to 18:00 or dynamic)
        // For simplicity, let's fix the view from 9 AM to 7 PM (10 hours)
        // Or better: dynamic based on earliest start and latest end

        let startHour = 9;
        let endHour = 19; // 7 PM

        const invalidTasks = [];
        const validTasks = [];

        tasks.forEach(task => {
            if (task.start_time && task.end_time) {
                const [h1, m1] = task.start_time.split(':').map(Number);
                const [h2, m2] = task.end_time.split(':').map(Number);

                const startVal = h1 + m1 / 60;
                let endVal = h2 + m2 / 60;

                // Handle cases where end time is roughly same as start time or inverted (typos)
                if (endVal <= startVal) endVal = startVal + (task.hours || 0.5);

                validTasks.push({
                    ...task,
                    startVal,
                    endVal
                });

                startHour = Math.min(startHour, Math.floor(startVal));
                endHour = Math.max(endHour, Math.ceil(endVal));
            } else {
                invalidTasks.push(task);
            }
        });

        // Add padding
        startHour = Math.max(0, startHour - 1);
        endHour = Math.min(24, endHour + 1);
        const totalDuration = endHour - startHour;

        return {
            validTasks: validTasks.map(t => ({
                ...t,
                left: ((t.startVal - startHour) / totalDuration) * 100,
                width: ((t.endVal - t.startVal) / totalDuration) * 100
            })),
            startHour,
            endHour,
            invalidTasks
        };
    }, [tasks]);

    if (!tasks || tasks.length === 0) return <div className="text-secondary text-center p-4">No tasks logged for this day.</div>;

    const { validTasks, startHour, endHour, invalidTasks } = processedTasks;
    const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

    return (
        <div className="gantt-chart-container card">
            <h3 className="card-title mb-4">Daily Timeline: {new Date(date).toLocaleDateString()}</h3>

            <div className="timeline-wrapper">
                {/* Time Axis */}
                <div className="time-axis">
                    {hours.map(hour => (
                        <div key={hour} className="time-marker" style={{ left: `${((hour - startHour) / (endHour - startHour)) * 100}%` }}>
                            <span className="time-label">{hour % 12 || 12} {hour < 12 ? 'AM' : 'PM'}</span>
                        </div>
                    ))}
                </div>

                {/* Grid Lines */}
                <div className="grid-lines">
                    {hours.map(hour => (
                        <div key={hour} className="grid-line" style={{ left: `${((hour - startHour) / (endHour - startHour)) * 100}%` }} />
                    ))}
                </div>

                {/* Tasks Bars */}
                <div className="tasks-track">
                    {validTasks.map((task) => (
                        <div
                            key={task.id}
                            className="task-bar-wrapper"
                            style={{
                                left: `${task.left}%`,
                                width: `${task.width}%`,
                                top: '10px' // Stacking logic could be added here for overlapping tasks
                            }}
                            onMouseEnter={() => setHoveredTask(task)}
                            onMouseLeave={() => setHoveredTask(null)}
                        >
                            <div className="task-bar">
                                <span className="task-bar-label">{task.task_type === 'Others' ? task.custom_task_name : task.task_type}</span>
                            </div>

                            {/* Tooltip */}
                            {hoveredTask && hoveredTask.id === task.id && (
                                <div className="task-tooltip">
                                    <strong>{task.task_type}</strong>
                                    {task.custom_task_name && <div>{task.custom_task_name}</div>}
                                    <div>{task.start_time} - {task.end_time}</div>
                                    <div>{task.hours} hrs</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Invalid/Untimed Tasks Warning */}
            {invalidTasks.length > 0 && (
                <div className="untimed-tasks mt-4">
                    <p className="text-sm text-secondary">
                        * {invalidTasks.length} tasks matching criteria do not have specific start/end times logged:
                        {invalidTasks.map(t => ` ${t.task_type}`).join(', ')}.
                    </p>
                </div>
            )}
        </div>
    );
}
