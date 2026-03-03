import { DataSource } from 'typeorm';
import bcrypt from 'bcrypt';
import { Admin } from '../entity/admin';
import { AdminRoleEnum } from '@common/enums/admin-role';

export async function seedAdmin(dataSource: DataSource) {
  const adminRepo = dataSource.getRepository(Admin);

  // 检查是否已存在 root 账户
  const existingRoot = await adminRepo.findOne({
    where: { username: 'root' },
  });

  if (existingRoot) {
    console.log('Root admin already exists, skipping...');
    return;
  }

  // 默认密码，部署后请立即修改
  const defaultPassword = process.env.ROOT_PASSWORD || 'root123456';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const rootAdmin = adminRepo.create({
    username: 'root',
    password: hashedPassword,
    role: AdminRoleEnum.SUPER_ADMIN,
    active: true,
  });

  await adminRepo.save(rootAdmin);
  console.log('Root admin created successfully');
  console.log('Username: root');
  console.log('Password:', defaultPassword);
  console.log('⚠️  Please change the password after first login!');
}
