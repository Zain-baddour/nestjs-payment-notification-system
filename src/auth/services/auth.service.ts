import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '@/users/services/user.service';
import { UserRepository } from '@/users/repositories/user.repository';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async register(registerDto: RegisterDto) {
    // التحقق من عدم وجود المستخدم
    const existingUser = await this.userRepository.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // إنشاء المستخدم الجديد
    const user = await this.userService.create({
      email: registerDto.email,
      password: registerDto.password,
      name: registerDto.name,
      role: registerDto.role,
    });

    // إنشاء التوكن
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user,
    };
  }

  async login(loginDto: LoginDto) {
    // التحقق من البريد وكلمة المرور
    const user = await this.userRepository.validatePassword(
      loginDto.email, 
      loginDto.password
    );

    if (!user) {
      console.log('❌ User not found');
      throw new UnauthorizedException('Invalid email or password');
    }

    // إنشاء التوكن
    const tokens = await this.generateTokens(user);

    // إرجاع البيانات بدون الباسورد
    const { password, ...userWithoutPassword } = user;

    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }
  // في AuthService - أضف debugging كامل
// async login(loginDto: LoginDto) {
//   console.log('🔍 === LOGIN DEBUG START ===');
//   console.log('📧 Input email:', loginDto.email);
//   console.log('🔑 Input password:', loginDto.password);
//   console.log('🔑 Password length:', loginDto.password.length);
  
//   // 1. جيب اليوزر
//   const user = await this.userRepository.findByEmail(loginDto.email);
  
//   console.log('👤 User found?', !!user);
  
//   if (!user) {
//     console.log('❌ User does not exist in database');
//     throw new UnauthorizedException('Invalid credentials');
//   }
  
//   console.log('🗓️  User created at:', user.createdAt);
//   console.log('🔐 Stored password:', user.password);
//   console.log('🔐 Password length in DB:', user.password?.length);
//   console.log('🔐 First 10 chars:', user.password?.substring(0, 10));
//   console.log('🔐 Is bcrypt hash?', user.password?.startsWith('$2'));
  
//   // 2. فحص مفصل للـ hash
//   if (user.password) {
//     if (user.password.startsWith('$2')) {
//       console.log('✅ Password IS bcrypt hash');
//       // تحليل الـ hash
//       const parts = user.password.split('$');
//       console.log('🔬 Hash format:', parts[1]); // 2a, 2b, 2y
//       console.log('🔬 Cost factor:', parts[2]?.substring(0, 2)); // 10, 12, etc
//     } else {
//       console.log('❌ Password is NOT bcrypt hash!');
//       console.log('🚨 It might be:', user.password.length < 20 ? 'PLAIN TEXT' : 'DIFFERENT ALGORITHM');
      
//       // إذا كانت plain text قصيرة
//       if (user.password.length < 30) {
//         console.log('🔍 Plain text comparison:');
//         console.log('   Input:', loginDto.password);
//         console.log('   Stored:', user.password);
//         console.log('   Match?', loginDto.password === user.password);
//       }
//     }
//   }
  
//   // 3. جرب bcrypt.compare مع error handling
//   let bcryptResult = false;
//   try {
//     console.log('🔄 Trying bcrypt.compare...');
//     bcryptResult = await bcrypt.compare(loginDto.password, user.password);
//     console.log('✅ bcrypt.compare result:', bcryptResult);
//   } catch (bcryptError) {
//     console.log('❌ bcrypt.compare ERROR:', bcryptError.message);
//     console.log('   This usually means the stored value is NOT a valid bcrypt hash');
//   }
  
//   // 4. جرب direct comparison (فقط للتشخيص)
//   const directMatch = loginDto.password === user.password;
//   console.log('🔍 Direct string comparison:', directMatch);
  
//   if (!bcryptResult && !directMatch) {
//     console.log('❌ === LOGIN FAILED ===');
//     console.log('   Reasons:');
//     console.log('   1. Password not matching');
//     console.log('   2. Hash corrupted');
//     console.log('   3. Wrong encryption method');
    
//     // محاولة أخيرة: جرب hash الكلمة وجاوبها
//     console.log('🔄 Generating new hash for comparison...');
//     const testHash = await bcrypt.hash(loginDto.password, 10);
//     console.log('🔬 New hash:', testHash.substring(0, 30) + '...');
//     console.log('🔬 Stored hash:', user.password.substring(0, 30) + '...');
//     console.log('🔬 Hashes similar?', testHash.substring(0, 7) === user.password.substring(0, 7));
    
//     throw new UnauthorizedException('Invalid password');
//   }
  
//   console.log('🎉 === LOGIN SUCCESSFUL ===');
  
//   // 5. إذا نجح plain text، شفرها
//   if (directMatch && !user.password.startsWith('$2')) {
//     console.log('🔐 Encrypting plain text password...');
//     const hashedPassword = await bcrypt.hash(user.password, 10);
//     await this.userRepository.update(user.id, { password: hashedPassword });
//     console.log('✅ Password encrypted for future use');
//   }
  
//   const { password, ...userWithoutPassword } = user;
//   return this.generateTokens(userWithoutPassword);
// }







  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newAccessToken = this.jwtService.sign(
        { sub: user.id, email: user.email, role: user.role },
        { expiresIn: '15m' }
      );

      return {
        access_token: newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    // هنا ممكن تحذف الـ refresh token من قاعدة البيانات
    // أو تضيفه للقائمة السوداء
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRATION', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 900, // 15 دقيقة بالثواني
    };
  }

  async validateUser(userId: string) {
    return this.userRepository.findById(userId);
  }
}