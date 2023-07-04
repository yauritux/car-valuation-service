import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './users.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: fakeUsersService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup(
      'john@example.com',
      'johnhasaverylongpassword',
    );

    expect(user.password).not.toEqual('johnhasaverylongpassword');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws a BadRequestException if user signs up with email that is in use', async () => {
    await service.signup('naruto@shippuden.tv', 'n15rr35');
    await expect(
      service.signup('naruto@shippuden.tv', 'n15rr35'),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws a NotFoundException if user signs in with an email that is not registered', async () => {
    await expect(
      service.signin('yurigagarin@test.com', 'pass123'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws a BadRequestException if user provided an invalid password', async () => {
    await service.signup('sasuke@shippuden.tv', 'sharingan123');
    await expect(
      service.signin('sasuke@shippuden.tv', 'verylongpassword'),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns a user if correct password is provided', async () => {
    await service.signup('yauri@github.com', 'mypassword');

    const user = await service.signin('yauri@github.com', 'mypassword');
    expect(user).toBeDefined();
  });
});
