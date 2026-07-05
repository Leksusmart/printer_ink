/* eslint-disable prettier/prettier */
/**
 * НАЗНАЧЕНИЕ ФАЙЛА:
 * Это Контроллер (Controller) приложения.
 * Он отвечает за обработку входящих HTTP-запросов от клиента (браузера, мобильного приложения)
 * и отправку ответов обратно. Контроллер не содержит сложную бизнес-логику,
 * он лишь принимает запрос и вызывает нужный метод из Сервиса.
 */

// Импортируем декоратор Controller для создания контроллера и Get для обработки GET-запросов
import { Controller, Get, Query, NotFoundException } from '@nestjs/common';
// Импортируем сервис, методы которого мы будем вызывать внутри контроллера
import { AppService } from './app.service';

// Декоратор Controller делает этот класс контроллером. 
// В скобках можно указать путь, например @Controller('users'), чтобы все маршруты начинались с /users
@Controller('employers') // Добавим префикс, чтобы разделить методы и писать /employers?phone=+79991112233
export class AppController {
  // Конструктор внедряет (Inject) зависимость AppService в этот класс.
  // private readonly создает скрытое свойство класса, и NestJS автоматически передает туда экземпляр сервиса
  constructor(private readonly appService: AppService) {}

  // Декоратор Get указывает, что метод ниже будет обрабатывать HTTP GET-запросы на корневой URL (/)
	// Заменяем старый getHello на работу с базой данных
	@Get() // получение без параметров
	async getHello() {
		// Ждем выполнения SQL-запроса из вашего сервиса
		const users = await this.appService.findAll();

		// Возвращаем результат. NestJS сам превратит его в JSON
		return users;
	}


	// метод для поиска по телефону
	// URL будет выглядеть так: GET /employers/search?phone=123
	@Get('search')
	async checkPhone(@Query('phone') phone: string) {
		// Создаем изменяемую копию строки, убрав лишние пробелы по краям
		let checkedPhone = phone.trim();
		if (checkedPhone.length === 11 && checkedPhone.startsWith('7')) {
			// Меняем первый пробел на плюс
			checkedPhone = '+' + checkedPhone;
		} else if (checkedPhone.length === 11 && checkedPhone.startsWith('8')) {
			// Меняем '8' на '+7'
			checkedPhone = '+7' + checkedPhone.slice(1);
		}
		if (!checkedPhone) {
			throw new NotFoundException('Параметр phone обязателен, Бэк ожидает /employers/search?phone=+79008000010');
		}

		const employer = await this.appService.findByPhone(checkedPhone);

		if (!employer) {
			throw new NotFoundException('Сотрудник с таким номером не найден');
		}

		return employer;
	}
}
