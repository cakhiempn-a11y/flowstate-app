import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useTasks } from '../store/useTasks';
import { DynamicIcon } from '../components/DynamicIcon';
import { Card, Button } from '../components/ui';
import { Search, Plus } from 'lucide-react';

import { differenceInCalendarDays, parseISO } from 'date-fns';
import TaskModal from '../components/TaskModal';
import ScheduleModal from '../components/ScheduleModal';
import { useTranslation } from '../i18n/useTranslation';

export default function UnscheduledTasks() {
  const { t } = useTranslation();
  const tasks = useTasks();
  const categories = useStore(s => s.categories);
  
  
  
  
  const updateTask = useStore(s => s.updateTask);

  const [search, setSearch] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<'create' | 'edit' | 'schedule'>('create');
  
  // Filter unscheduled tasks
  const unscheduledTasks = tasks.filter(t_item => {
    if (t_item.date && t_item.date !== '') return false; // Must be unscheduled
    if (t_item.status === 'Skipped' || t_item.status === 'Cancelled') return false; // Never show skipped/cancelled tasks in Unscheduled
    if (t_item.title.toLowerCase().includes(search.toLowerCase()) === false) return false;
    return true;
  });

  const activeTasks = unscheduledTasks.filter(t => t.status !== 'Completed' && t.status !== 'Skipped' && t.status !== 'Cancelled');
  const inactiveTasks = unscheduledTasks.filter(t => t.status === 'Completed' || t.status === 'Skipped' || t.status === 'Cancelled');

  const displayTasks = [...activeTasks, ...inactiveTasks];

  const getCategory = (id: string) => categories.find(c => c.id === id);

  const handleEdit = (id: string) => {
    setEditingTaskId(id);
    setModalAction('edit');
    setModalOpen(true);
  };

  const handleSchedule = (id: string) => {
    setEditingTaskId(id);
    setScheduleModalOpen(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground">
            {t('nav.unscheduledTasks') || 'Unscheduled Tasks'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('unscheduledTasks.description') || 'Tasks without a specific date or time will appear here.'}
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingTaskId(null);
            setModalAction('create');
            setModalOpen(true);
          }} 
          className="rounded-xl font-bold flex-shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('tasks.createTask')}
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('tasks.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="space-y-4">
        {displayTasks.length === 0 ? (
          <Card className="p-8 md:p-12 text-center flex flex-col items-center justify-center border-dashed">
            <h3 className="text-xl font-bold text-foreground mb-2">
              {t('unscheduledTasks.emptyTitle') || 'No unscheduled tasks'}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {t('unscheduledTasks.emptyMessage') || 'Tasks without a specific date or time will appear here.'}
            </p>
            
          </Card>
        ) : (
          <div className="grid gap-3">
            {displayTasks.map(task => {
              const category = getCategory(task.categoryId);
              const isInactive = task.status === 'Completed' || task.status === 'Skipped' || task.status === 'Cancelled';
              
              let deadlineText = t('unscheduledTasks.noDueDate') || 'No due date';
              let deadlineColor = 'text-muted-foreground font-semibold';
              if (task.deadline) {
                const daysDiff = differenceInCalendarDays(parseISO(task.deadline), new Date());
                if (daysDiff < 0) {
                  const absDays = Math.abs(daysDiff);
                  const key = absDays === 1 ? 'unscheduledTasks.overdueDay' : 'unscheduledTasks.overdueDays';
                  deadlineText = (t(key) || `Overdue ${absDays} days`).replace('{{count}}', absDays.toString());
                  deadlineColor = 'text-red-500 font-bold';
                } else if (daysDiff === 0) {
                  deadlineText = t('unscheduledTasks.today') || 'Today';
                  deadlineColor = 'text-orange-500 font-bold';
                } else {
                  const key = daysDiff === 1 ? 'unscheduledTasks.remainingDay' : 'unscheduledTasks.remainingDays';
                  deadlineText = (t(key) || `${daysDiff} days`).replace('{{count}}', daysDiff.toString());
                  deadlineColor = 'text-muted-foreground font-semibold';
                }
              }

              return (
                <Card 
                  key={task.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 hover:border-primary/50 transition-colors cursor-pointer group ${isInactive ? 'opacity-50' : ''}`}
                  onClick={() => handleEdit(task.id)}
                >
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors text-base mb-1">
                      {task.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                      {category && (
                        <div className="flex items-center gap-1.5" style={{ color: category.color }}>
                          <DynamicIcon name={category.icon} className="w-3.5 h-3.5" />
                          <span>{category.name}</span>
                        </div>
                      )}
                      
                      {category && (
                        <span className="text-muted-foreground/40">&middot;</span>
                      )}
                      
                      <div className={`flex items-center gap-1.5 ${task.priority === 'High' || task.priority === 'Urgent' ? 'text-red-500' : task.priority === 'Medium' ? 'text-orange-500' : 'text-blue-500'}`}>
                        <span>{t(`priority.${task.priority.toLowerCase()}`) || task.priority}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-0 border-border/50 flex-shrink-0">
                    <span className={`text-sm ${deadlineColor}`}>
                      {deadlineText}
                    </span>
                    
                    <Button
                      variant="primary"
                      className="rounded-xl px-5 font-bold uppercase text-xs tracking-wider shadow-md hover:shadow-lg transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSchedule(task.id);
                      }}
                    >
                      {t('unscheduledTasks.schedule') || 'Schedule'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {isScheduleModalOpen && (
        <ScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setScheduleModalOpen(false);
            setEditingTaskId(null);
          }}
          task={tasks.find(t => t.id === editingTaskId)!}
        />
      )}
      {isModalOpen && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingTaskId(null);
          }}
          existingTask={editingTaskId ? tasks.find(t => t.id === editingTaskId) : undefined}
          modalAction={modalAction}
          defaultDate={editingTaskId ? undefined : ""} // Ensure new task has empty date by default here
          defaultTime={editingTaskId ? undefined : ""}
          isUnscheduledContext={true}
        />
      )}
    </div>
  );
}
