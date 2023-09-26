import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminGuardService {
    private userPassword = 'ultimate!!!password';

    isAccessGranted(userPassword: string) {
        if (userPassword !== this.userPassword) {
            throw new Error('Invalid password');
        }
    }
}
