import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminGuardService {
    private privateUserPassword = '1';

    set userPassword(value: string) {
        this.privateUserPassword = value;
    }

    isAccessGranted(userPassword: string) {
        if (userPassword !== this.privateUserPassword) {
            throw new Error('access is not granted');
        }
    }
}
