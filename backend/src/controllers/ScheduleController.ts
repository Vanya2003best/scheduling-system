// controllers/ScheduleController.ts

import { Request, Response } from 'express';
import { SchedulingAlgorithm } from '../services/SchedulingAlgorithm';
import { EmployeeRepository } from '../repositories/EmployeeRepository';
import { PreferenceRepository } from '../repositories/PreferenceRepository';
import { StaffingRequirementRepository } from '../repositories/StaffingRequirementRepository';
import { ScheduleRepository } from '../repositories/ScheduleRepository';
import { JobQueue } from '../services/JobQueue';

export class ScheduleController {
  
  /**
   * Получение списка доступных месяцев для просмотра расписаний
   */
  public static async getAvailableSchedules(req: Request, res: Response): Promise<void> {
    try {
      const employeeId = req.user.id; // Предполагается, что ID сотрудника хранится в объекте пользователя
      const schedules = await ScheduleRepository.findAvailableForEmployee(employeeId);
      
      res.status(200).json(schedules);
    } catch (error) {
      console.error('Error fetching available schedules:', error);
      res.status(500).json({ error: 'Не удалось получить список доступных расписаний' });
    }
  }
  
  /**
   * Получение детального расписания на конкретный месяц
   */
  public static async getSchedule(req: Request, res: Response): Promise<void> {
    try {
      const monthId = parseInt(req.params.monthId);
      const employeeId = req.user.id;
      
      const schedule = await ScheduleRepository.findByMonthForEmployee(monthId, employeeId);
      
      if (!schedule) {
        res.status(404).json({ error: 'Расписание не найдено' });
        return;
      }
      
      res.status(200).json(schedule);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      res.status(500).json({ error: 'Не удалось получить расписание' });
    }
  }
  
  /**
   * Создание расписания для админа (асинхронный процесс)
   */
  public static async generateSchedule(req: Request, res: Response): Promise<void> {
    try {
      const monthId = parseInt(req.params.monthId);
      const options = req.body.options || {};
      
      // Создаем задачу в очереди для асинхронного выполнения
      const jobId = await JobQueue.enqueue('schedule_generation', {
        monthId,
        options,
        userId: req.user.id
      });
      
      // Запускаем процесс генерации в фоновом режиме
      JobQueue.processJob(jobId, async (job) => {
        try {
          // Получаем необходимые данные
          const employees = await EmployeeRepository.findAll();
          const preferences = await PreferenceRepository.findByMonth(monthId);
          const requirements = await StaffingRequirementRepository.findAll();
          
          // Обновляем статус задачи
          await JobQueue.updateProgress(jobId, 30);
          
          // Генерируем расписание
          const schedule = SchedulingAlgorithm.generateSchedule(
            monthId,
            employees,
            preferences,
            requirements,
            options
          );
          
          // Обновляем статус задачи
          await JobQueue.updateProgress(jobId, 70);
          
          // Сохраняем расписание в базу данных
          await ScheduleRepository.save(schedule);
          
          // Завершаем задачу успешно
          await JobQueue.complete(jobId, schedule);
        } catch (error) {
          console.error('Error in schedule generation job:', error);
          await JobQueue.fail(jobId, error.message);
        }
      });
      
      // Отправляем ID задачи клиенту для последующей проверки статуса
      res.status(202).json({
        id: jobId,
        status: 'pending',
        progress: 0
      });
    } catch (error) {
      console.error('Error starting schedule generation:', error);
      res.status(500).json({ error: 'Не удалось начать генерацию расписания' });
    }
  }
  
  /**
   * Публикация расписания (делает его видимым для сотрудников)
   */
  public static async publishSchedule(req: Request, res: Response): Promise<void> {
    try {
      const monthId = parseInt(req.params.monthId);
      
      // Проверяем, существует ли расписание
      const schedule = await ScheduleRepository.findByMonth(monthId);
      
      if (!schedule) {
        res.status(404).json({ error: 'Расписание не найдено' });
        return;
      }
      
      // Обновляем статус расписания
      schedule.status = 'published';
      await ScheduleRepository.save(schedule);
      
      // Отправляем уведомления сотрудникам
      // NotificationService.sendSchedulePublishedNotifications(schedule);
      
      res.status(200).json({ success: true, message: 'Расписание успешно опубликовано' });
    } catch (error) {
      console.error('Error publishing schedule:', error);
      res.status(500).json({ error: 'Не удалось опубликовать расписание' });
    }
  }
  
  /**
   * Проверка статуса задачи генерации расписания
   */
  public static async checkJobStatus(req: Request, res: Response): Promise<void> {
    try {
      const jobId = req.params.jobId;
      
      const job = await JobQueue.getJobStatus(jobId);
      
      if (!job) {
        res.status(404).json({ error: 'Задача не найдена' });
        return;
      }
      
      res.status(200).json(job);
    } catch (error) {
      console.error('Error checking job status:', error);
      res.status(500).json({ error: 'Не удалось проверить статус задачи' });
    }
  }
}
