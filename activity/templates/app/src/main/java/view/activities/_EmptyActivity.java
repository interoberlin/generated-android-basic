package <%= activityPackage %>;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;

import <%= appPackage %>.R;

public class <%= activityName %> extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.<%= layoutName %>);
    }
}
